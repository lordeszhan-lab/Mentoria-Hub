"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  OnboardingFinalSchema,
  ProfileUpdateSchema,
  type OnboardingFinal,
  type ProfileUpdate,
} from "@/lib/zod/profile";
import type { ProfileRow } from "@/lib/supabase/types";

// ── Helpers ────────────────────────────────────────────────────────────────

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  return { supabase, user };
}

/**
 * Typed wrapper around supabase.from("profiles").
 * The hand-rolled Database schema lacks the index signatures that
 * @supabase/postgrest-js's GenericSchema constraint requires, so the inferred
 * update() parameter type resolves to `never`. Wrapping via `any` is safe
 * because Zod validates every payload before it reaches this function.
 */
function profilesTable(supabase: Awaited<ReturnType<typeof createClient>>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from("profiles") as {
    update: (
      values: Partial<ProfileRow>,
    ) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
    select: (
      cols: string,
    ) => { eq: (col: string, val: string) => { single: () => Promise<{ data: ProfileRow | null; error: { message: string } | null }> } };
  };
}

// ── Onboarding ─────────────────────────────────────────────────────────────

/**
 * Progressive partial write during onboarding.
 * Called after each step so a page refresh doesn't lose data.
 */
export async function updateOnboarding(
  partial: Partial<OnboardingFinal>,
): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();

  const parsed = OnboardingFinalSchema.partial().safeParse(partial);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const { error } = await profilesTable(supabase)
    .update(parsed.data as Partial<ProfileRow>)
    .eq("id", user.id);

  if (error) return { error: error.message };
  return {};
}

/**
 * Final onboarding submission.
 * Validates the complete payload, persists everything, and marks
 * onboarding_completed = true.
 * Fire-and-forget profile embedding after save.
 */
export async function completeOnboarding(
  data: OnboardingFinal,
): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();

  const parsed = OnboardingFinalSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const { error } = await profilesTable(supabase)
    .update({ ...parsed.data, onboarding_completed: true } as Partial<ProfileRow>)
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Fire-and-forget: embed updated profile (does not block response)
  void (async () => {
    try {
      const { embedProfile } = await import("@/server/embeddings/profile");
      await embedProfile(user.id);
    } catch (e) {
      console.error("[completeOnboarding] embedProfile failed:", e);
    }
  })();

  return {};
}

/**
 * Fetch the current user's profile.
 */
export async function getProfile(): Promise<{
  profile: ProfileRow | null;
  error: string | null;
}> {
  const { supabase, user } = await requireUser();

  const { data, error } = await profilesTable(supabase)
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return { profile: null, error: error.message };
  return { profile: data, error: null };
}

// ── Profile ────────────────────────────────────────────────────────────────

/**
 * Full profile update (profile page).
 * Re-embeds profile when goal or interests change (fire-and-forget).
 */
export async function updateProfile(
  data: ProfileUpdate,
): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();

  const parsed = ProfileUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const { error } = await profilesTable(supabase)
    .update(parsed.data as Partial<ProfileRow>)
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Re-embed when semantically relevant fields changed
  const semanticKeys: (keyof ProfileUpdate)[] = ["goal", "interests", "subjects", "target_majors", "grade"];
  const hasSemanticChange = semanticKeys.some((k) => k in parsed.data);
  if (hasSemanticChange) {
    void (async () => {
      try {
        const { embedProfile } = await import("@/server/embeddings/profile");
        await embedProfile(user.id);
      } catch (e) {
        console.error("[updateProfile] embedProfile failed:", e);
      }
    })();
  }

  return {};
}
