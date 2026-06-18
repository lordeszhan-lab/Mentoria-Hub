"use server";

/**
 * Centralised gamification engine.
 *
 * awardXp    — write xp_events + increment profiles.xp + fire milestone achievements
 * touchStreak — maintain the learning streak; encouraging framing, never shaming
 *
 * Both are fire-and-forget helpers called from other server actions.
 * Failures are swallowed so gamification never blocks a user action.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPush } from "@/server/notifications/push";

// ── Milestone thresholds ──────────────────────────────────────────────────────

const XP_MILESTONES = [100, 500, 1000] as const;
const STREAK_MILESTONES = [7, 14, 30] as const;

// ── awardXp ───────────────────────────────────────────────────────────────────

/**
 * Increment `profiles.xp` and record an `xp_events` row for leaderboard windows.
 * Inserts an `achievement` notification when an XP milestone is first crossed.
 */
export async function awardXp(
  userId: string,
  amount: number,
  reason: string,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  try {
    // Fetch current XP so we can detect milestone crossings
    const { data: profile } = (await db
      .from("profiles")
      .select("xp")
      .eq("id", userId)
      .single()) as { data: { xp: number } | null };

    const oldXp = profile?.xp ?? 0;
    const newXp = oldXp + amount;

    // Insert event row (drives weekly leaderboard windows)
    await db.from("xp_events").insert({
      user_id: userId,
      amount,
      reason,
    });

    // Increment XP on profile
    await db.from("profiles").update({ xp: newXp }).eq("id", userId);

    // Fire the lowest uncrossed milestone achievement (one per action)
    for (const milestone of XP_MILESTONES) {
      if (oldXp < milestone && newXp >= milestone) {
        await db.from("notifications").insert({
          user_id: userId,
          kind: "achievement",
          title: `${milestone} XP milestone!`,
          body: `You've earned ${milestone} XP on Mentoria Hub. Your dedication is paying off!`,
          url: "/dashboard",
        });
        await sendPush(userId, {
          title: `${milestone} XP milestone!`,
          body: `You've earned ${milestone} XP. Your dedication is paying off!`,
          url: "/dashboard",
        }).catch(() => {});
        break;
      }
    }
  } catch {
    // Non-fatal — gamification must never block the user
  }
}

// ── touchStreak ───────────────────────────────────────────────────────────────

export interface TouchStreakResult {
  streakCount: number;
  /** true when the count just went up (use to trigger UI celebration) */
  incremented: boolean;
}

/**
 * Update the user's learning streak on any qualifying activity
 * (lesson complete, quiz pass, roadmap step done).
 *
 * Logic:
 *   streak_last_active === yesterday  →  +1 (continuing streak)
 *   streak_last_active === today      →  no change (already counted)
 *   otherwise                         →  reset to 1 (fresh start, not a punishment)
 */
export async function touchStreak(userId: string): Promise<TouchStreakResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const fallback: TouchStreakResult = { streakCount: 1, incremented: false };

  try {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

    const { data: profile } = (await db
      .from("profiles")
      .select("streak_count, streak_last_active")
      .eq("id", userId)
      .single()) as {
      data: { streak_count: number; streak_last_active: string | null } | null;
    };

    if (!profile) return fallback;

    const { streak_count: count, streak_last_active: lastActive } = profile;

    let newCount: number;
    let incremented = false;

    if (lastActive === today) {
      // Already active today — streak intact, no double-count
      newCount = count;
    } else if (lastActive === yesterday || !lastActive) {
      // Extending or starting a streak — celebrate!
      newCount = count + 1;
      incremented = true;
    } else {
      // Gap in activity — gentle reset ("every day is a fresh start")
      newCount = 1;
    }

    await db
      .from("profiles")
      .update({ streak_count: newCount, streak_last_active: today })
      .eq("id", userId);

    // Fire milestone achievement notifications
    if (incremented) {
      for (const milestone of STREAK_MILESTONES) {
        if (newCount === milestone) {
          await db.from("notifications").insert({
            user_id: userId,
            kind: "achievement",
            title: `${milestone}-day streak!`,
            body: `${milestone} days of consistent learning — that's incredible consistency!`,
            url: "/dashboard",
          });
          await sendPush(userId, {
            title: `${milestone}-day streak!`,
            body: `${milestone} days of consistent learning — keep it up!`,
            url: "/dashboard",
          }).catch(() => {});
          break;
        }
      }
    }

    return { streakCount: newCount, incremented };
  } catch {
    return fallback;
  }
}
