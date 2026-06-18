/**
 * Profile embedding.
 *
 * Composes a semantically rich string from a user's profile and writes
 * the resulting vector into profiles.profile_vector (vector(1536)).
 *
 * Called fire-and-forget after onboarding completion and profile edits.
 * Never throws — errors are logged but do not block the response.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/openai/embeddings";
import type { ProfileRow } from "@/lib/supabase/types";

function composeProfileText(profile: ProfileRow): string {
  return [
    profile.goal ?? "",
    (profile.interests ?? []).join(" "),
    (profile.subjects ?? []).join(" "),
    profile.grade != null ? `grade ${profile.grade}` : "",
    (profile.target_majors ?? []).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export async function embedProfile(userId: string): Promise<void> {
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: profile, error: fetchErr } = (await db
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()) as {
    data: ProfileRow | null;
    error: { message: string } | null;
  };

  if (fetchErr || !profile) {
    console.error(`[embedProfile] Failed to fetch profile ${userId}:`, fetchErr?.message);
    return;
  }

  const text = composeProfileText(profile);
  if (!text) {
    console.log(`[embedProfile] Profile ${userId} has no text to embed.`);
    return;
  }

  const embedding = await embedText(text);

  const { error: upErr } = await db
    .from("profiles")
    .update({ profile_vector: JSON.stringify(embedding) })
    .eq("id", userId);

  if (upErr) {
    console.error(
      `[embedProfile] Failed to update profile ${userId}:`,
      (upErr as { message: string }).message,
    );
  }
}
