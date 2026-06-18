"use server";

import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/openai/embeddings";
import type { OpportunityFormValues } from "@/lib/zod/admin";
import type { CategoryRow, OpportunityRow } from "@/lib/supabase/types";

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

// ── Embedding helper ────────────────────────────────────────────────────────

async function computeEmbedding(
  opp: Partial<OpportunityRow>,
  categoryName: string | null,
): Promise<string> {
  const text = [
    opp.title ?? "",
    categoryName ?? "",
    (opp.type ?? "").replace(/_/g, " "),
    opp.format ?? "",
    opp.region ?? "",
    opp.description ?? "",
    opp.requirements ?? "",
    (opp.tags ?? []).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .trim()
    .slice(0, 8000);

  const vector = await embedText(text);
  return JSON.stringify(vector);
}

async function getCategoryName(categoryId: string | null): Promise<string | null> {
  if (!categoryId) return null;
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data } = await db
    .from("categories")
    .select("name_en")
    .eq("id", categoryId)
    .single() as { data: { name_en: string } | null };
  return data?.name_en ?? null;
}

// ── Slug helper ─────────────────────────────────────────────────────────────

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 120);
}

// ── Create ──────────────────────────────────────────────────────────────────

export async function createOpportunity(
  values: OpportunityFormValues,
): Promise<{ id: string } | { error: string }> {
  const user = await requireAdmin();
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  const slug = values.slug || toSlug(values.title);
  const categoryName = await getCategoryName(values.category_id ?? null);

  const partial: Partial<OpportunityRow> = {
    title: values.title,
    description: values.description,
    requirements: values.requirements ?? null,
    category_id: values.category_id ?? null,
    type: values.type,
    format: values.format ?? null,
    min_grade: values.min_grade ?? null,
    max_grade: values.max_grade ?? null,
    region: values.region ?? null,
    deadline: values.deadline ?? null,
    apply_url: values.apply_url || null,
    source: values.source ?? null,
    tags: values.tags,
    status: values.status,
    created_by: user.id,
  };

  let embedding: string | null = null;
  try {
    embedding = await computeEmbedding(partial, categoryName);
  } catch {
    // non-fatal — opportunity is still created
  }

  const { data, error } = await db.from("opportunities").insert({
    ...partial,
    slug,
    embedding,
  }).select("id").single();

  if (error) return { error: (error as { message: string }).message };
  return { id: (data as { id: string }).id };
}

// ── Update ──────────────────────────────────────────────────────────────────

export async function updateOpportunity(
  id: string,
  values: OpportunityFormValues,
): Promise<void | { error: string }> {
  await requireAdmin();
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  const slug = values.slug || toSlug(values.title);
  const categoryName = await getCategoryName(values.category_id ?? null);

  const partial: Partial<OpportunityRow> = {
    title: values.title,
    slug,
    description: values.description,
    requirements: values.requirements ?? null,
    category_id: values.category_id ?? null,
    type: values.type,
    format: values.format ?? null,
    min_grade: values.min_grade ?? null,
    max_grade: values.max_grade ?? null,
    region: values.region ?? null,
    deadline: values.deadline ?? null,
    apply_url: values.apply_url || null,
    source: values.source ?? null,
    tags: values.tags,
    status: values.status,
  };

  let embedding: string | null = null;
  try {
    embedding = await computeEmbedding(partial, categoryName);
  } catch {
    // non-fatal
  }

  const { error } = await db
    .from("opportunities")
    .update({ ...partial, ...(embedding ? { embedding } : {}) })
    .eq("id", id);

  if (error) return { error: (error as { message: string }).message };
}

// ── Archive ─────────────────────────────────────────────────────────────────

export async function archiveOpportunity(
  id: string,
): Promise<void | { error: string }> {
  await requireAdmin();
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const { error } = await db
    .from("opportunities")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) return { error: (error as { message: string }).message };
}

// ── Delete ──────────────────────────────────────────────────────────────────

export async function deleteOpportunity(
  id: string,
): Promise<void | { error: string }> {
  await requireAdmin();
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const { error } = await db.from("opportunities").delete().eq("id", id);
  if (error) return { error: (error as { message: string }).message };
}

// ── Read helpers ─────────────────────────────────────────────────────────────

export async function getOpportunity(
  id: string,
): Promise<OpportunityRow | null> {
  await requireAdmin();
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data } = await db
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .single();
  return (data as OpportunityRow | null);
}

export async function listOpportunities(opts?: {
  q?: string;
  status?: string;
  page?: number;
}): Promise<{ rows: OpportunityRow[]; count: number }> {
  await requireAdmin();
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const PAGE_SIZE = 30;
  const page = opts?.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = db.from("opportunities").select("*", { count: "exact" });
  if (opts?.q) {
    q = q.textSearch("search_vector", opts.q, {
      type: "websearch",
      config: "english",
    });
  }
  if (opts?.status) q = q.eq("status", opts.status);
  q = q.order("created_at", { ascending: false }).range(from, to);

  const { data, count, error } = await q;
  if (error) throw new Error((error as { message: string }).message);
  return { rows: (data ?? []) as OpportunityRow[], count: count ?? 0 };
}

// ── Dedup check ──────────────────────────────────────────────────────────────

export async function checkDuplicate(
  candidate: OpportunityFormValues,
  excludeId?: string,
): Promise<{
  isDuplicate: boolean;
  match?: { id: string; title: string; similarity: number };
}> {
  await requireAdmin();
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  const categoryName = await getCategoryName(candidate.category_id ?? null);
  const partial: Partial<OpportunityRow> = {
    title: candidate.title,
    description: candidate.description,
    requirements: candidate.requirements ?? null,
    type: candidate.type,
    format: candidate.format ?? null,
    region: candidate.region ?? null,
    tags: candidate.tags,
  };

  let embedding: string;
  try {
    embedding = await computeEmbedding(partial, categoryName);
  } catch {
    return { isDuplicate: false };
  }

  // Fetch all published/draft opportunity IDs (except the one being edited)
  const { data: allIds } = await db
    .from("opportunities")
    .select("id")
    .neq("status", "archived") as { data: Array<{ id: string }> | null };

  const ids = (allIds ?? [])
    .map((r) => r.id)
    .filter((id) => id !== excludeId);

  if (ids.length === 0) return { isDuplicate: false };

  const { data: matches } = await db.rpc("match_opportunities", {
    p_vector: embedding,
    p_ids: ids,
    p_limit: 1,
  }) as { data: Array<{ id: string; similarity: number }> | null };

  const top = matches?.[0];
  if (!top || top.similarity < 0.92) return { isDuplicate: false };

  const { data: opp } = await db
    .from("opportunities")
    .select("id, title")
    .eq("id", top.id)
    .single() as { data: { id: string; title: string } | null };

  return {
    isDuplicate: true,
    match: opp ? { ...opp, similarity: top.similarity } : undefined,
  };
}

// ── Get categories ────────────────────────────────────────────────────────────

export async function getCategories(): Promise<CategoryRow[]> {
  await requireAdmin();
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data } = await db.from("categories").select("*").order("name_en");
  return (data ?? []) as CategoryRow[];
}
