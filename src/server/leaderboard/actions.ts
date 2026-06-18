"use server";

/**
 * Leaderboard server actions.
 *
 * getWeeklyLeaderboard — calls the weekly_leaderboard() Postgres function and
 * returns the full ranking plus the current user's entry (even if they sit
 * outside the visible top-N).
 *
 * Week boundaries are computed by Postgres (ISO Mon–Sun UTC) so the result is
 * always consistent regardless of the server's local timezone.
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  weeklyXp: number;
  rank: number;
  /** First name only — derived from displayName; never an email. */
  firstName: string;
  /** Single uppercase letter for the avatar. */
  initial: string;
}

export interface WeeklyLeaderboardResult {
  entries: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  weekLabel: string;    // e.g. "Jun 16 – Jun 22"
  weekStart: string;    // ISO date string (Monday)
  weekEnd: string;      // ISO date string (Sunday)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** ISO Monday of the current UTC week. */
function currentWeekBounds(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  // getUTCDay() — 0=Sun, 1=Mon, … 6=Sat
  const utcDay = now.getUTCDay();
  // Days since Monday (ISO): Sun → 6, Mon → 0, Tue → 1 …
  const daysSinceMon = (utcDay + 6) % 7;

  const weekStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysSinceMon,
    ),
  );
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);
  return { weekStart, weekEnd };
}

function formatWeekLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const s = start.toLocaleDateString("en-US", opts);
  // end is exclusive (next Monday), so show end - 1 day
  const endInclusive = new Date(end.getTime() - 86_400_000);
  const e = endInclusive.toLocaleDateString("en-US", opts);
  return `${s} – ${e}`;
}

function toEntry(row: {
  user_id: string;
  display_name: string;
  weekly_xp: number;
  rank: number;
}): LeaderboardEntry {
  const firstName = row.display_name.split(" ")[0] ?? row.display_name;
  return {
    userId: row.user_id,
    displayName: row.display_name,
    weeklyXp: row.weekly_xp,
    rank: row.rank,
    firstName,
    initial: firstName.charAt(0).toUpperCase(),
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Fetches the current week's leaderboard.
 *
 * @param currentUserId  The authenticated user's id (to pin their row).
 * @param limit          How many rows to include in the visible list (default 20).
 */
export async function getWeeklyLeaderboard(
  currentUserId: string,
  limit = 20,
): Promise<WeeklyLeaderboardResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const { weekStart, weekEnd } = currentWeekBounds();
  const weekLabel = formatWeekLabel(weekStart, weekEnd);

  const { data, error } = await db.rpc("weekly_leaderboard");

  if (error) {
    console.error("[leaderboard] weekly_leaderboard RPC error:", error);
    return {
      entries: [],
      currentUserEntry: null,
      weekLabel,
      weekStart: weekStart.toISOString().split("T")[0],
      weekEnd: weekEnd.toISOString().split("T")[0],
    };
  }

  const rows = (data ?? []) as Array<{
    user_id: string;
    display_name: string;
    weekly_xp: number;
    rank: number;
  }>;

  const allEntries = rows.map(toEntry);
  const entries = allEntries.slice(0, limit);

  const currentUserEntry =
    allEntries.find((e) => e.userId === currentUserId) ?? null;

  return {
    entries,
    currentUserEntry,
    weekLabel,
    weekStart: weekStart.toISOString().split("T")[0],
    weekEnd: weekEnd.toISOString().split("T")[0],
  };
}
