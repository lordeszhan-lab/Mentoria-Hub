import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { DeadlineRow } from "@/lib/supabase/types";

// ── Per-user upcoming deadlines (next 30 days) ────────────────────────────────

/**
 * Fetches upcoming deadlines for a user within the next 30 days.
 * Ordered chronologically. Used by the dashboard widget.
 */
export async function getUpcomingDeadlines(userId: string): Promise<DeadlineRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const now = new Date().toISOString();
  const in30d = new Date(Date.now() + 30 * 86_400_000).toISOString();

  const { data } = (await db
    .from("deadlines")
    .select("*")
    .eq("user_id", userId)
    .gte("due_at", now)
    .lte("due_at", in30d)
    .order("due_at", { ascending: true })) as { data: DeadlineRow[] | null };

  return data ?? [];
}

// ── Token-based deadline feed (calendar subscription) ────────────────────────

export interface CalendarFeedResult {
  deadlines: DeadlineRow[];
  userId: string;
}

/**
 * Looks up a user by their `calendar_token` (service-role, bypasses RLS).
 * Returns all upcoming deadlines for the calendar feed (next 365 days).
 * Returns null if the token is unknown.
 */
export async function getDeadlinesByCalendarToken(
  token: string,
): Promise<CalendarFeedResult | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  // Look up the profile by calendar_token
  const { data: profile, error: profileError } = (await db
    .from("profiles")
    .select("id")
    .eq("calendar_token", token)
    .maybeSingle()) as {
    data: { id: string } | null;
    error: { message: string } | null;
  };

  if (profileError || !profile) return null;

  const now = new Date().toISOString();
  const in365d = new Date(Date.now() + 365 * 86_400_000).toISOString();

  const { data } = (await db
    .from("deadlines")
    .select("*")
    .eq("user_id", profile.id)
    .gte("due_at", now)
    .lte("due_at", in365d)
    .order("due_at", { ascending: true })) as { data: DeadlineRow[] | null };

  return { deadlines: data ?? [], userId: profile.id };
}
