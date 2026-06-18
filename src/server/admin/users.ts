"use server";

import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRow } from "@/lib/supabase/types";
import { UserRoleUpdateSchema } from "@/lib/zod/admin";

// ── Auth guard ──────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null };

  if (profile?.role !== "admin") redirect("/dashboard");
  return user;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdminUserRow extends ProfileRow {
  email: string | null;
}

// ── List users (paginated) ────────────────────────────────────────────────────

export async function listUsers(opts?: {
  page?: number;
  q?: string;
}): Promise<{ rows: AdminUserRow[]; count: number }> {
  await requireAdmin();
  const PAGE_SIZE = 30;
  const page = opts?.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = db
    .from("profiles")
    .select("*", { count: "exact" });

  if (opts?.q) {
    q = q.ilike("full_name", `%${opts.q}%`);
  }

  q = q.order("created_at", { ascending: false }).range(from, to);

  const { data, count, error } = await q;
  if (error) throw new Error((error as { message: string }).message);

  const profiles = (data ?? []) as ProfileRow[];

  // Fetch emails from auth.admin API
  const authAdmin = createAdminClient().auth.admin;
  const emailMap: Record<string, string> = {};

  try {
    const ids = profiles.map((p) => p.id);
    // Batch fetch — up to 30 per page already
    const emailFetches = await Promise.allSettled(
      ids.map((id) => authAdmin.getUserById(id)),
    );
    for (let i = 0; i < ids.length; i++) {
      const res = emailFetches[i];
      if (res.status === "fulfilled" && res.value.data.user) {
        emailMap[ids[i]!] = res.value.data.user.email ?? "";
      }
    }
  } catch {
    // non-fatal — email column stays null
  }

  const rows: AdminUserRow[] = profiles.map((p) => ({
    ...p,
    email: emailMap[p.id] ?? null,
  }));

  return { rows, count: count ?? 0 };
}

// ── Update role ──────────────────────────────────────────────────────────────

export async function updateUserRole(
  userId: string,
  newRole: "student" | "mentor" | "admin",
): Promise<void | { error: string }> {
  const me = await requireAdmin();

  const parsed = UserRoleUpdateSchema.safeParse({ userId, role: newRole });
  if (!parsed.success) return { error: "Invalid input" };

  // Prevent self-demotion
  if (userId === me.id && newRole !== "admin") {
    return { error: "Cannot change your own admin role" };
  }

  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const { error } = await db
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) return { error: (error as { message: string }).message };
}
