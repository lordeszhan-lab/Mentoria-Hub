"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { awardXp } from "@/server/gamification/actions";
import { XP_OPPORTUNITY_SAVED } from "@/lib/constants";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/login");
  return { supabase, user };
}

/**
 * Toggle save state for an opportunity.
 * Returns the new saved state. RLS ensures users can only mutate their own rows.
 *
 * Use optimistic UI on the client: call setOptimisticSaved() before awaiting this.
 */
export async function toggleSave(
  opportunityId: string,
): Promise<{ saved: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Check existing row
  const { data: existing } = await db
    .from("saved_opportunities")
    .select("id")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  if (existing) {
    const { error } = await db
      .from("saved_opportunities")
      .delete()
      .eq("id", existing.id);
    if (error) return { saved: true, error: (error as { message: string }).message };
    return { saved: false };
  }

  const { error } = await db.from("saved_opportunities").insert({
    user_id: user.id,
    opportunity_id: opportunityId,
  });
  if (error) return { saved: false, error: (error as { message: string }).message };

  // Fire-and-forget XP for saving an opportunity
  void awardXp(user.id, XP_OPPORTUNITY_SAVED, `opportunity_saved:${opportunityId}`);

  return { saved: true };
}

/**
 * Fetch all saved opportunity IDs for a given user.
 * Called from server components to initialise optimistic state on cards.
 */
export async function getSavedIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("saved_opportunities")
    .select("opportunity_id")
    .eq("user_id", userId);
  return ((data ?? []) as Array<{ opportunity_id: string }>).map(
    (r) => r.opportunity_id,
  );
}
