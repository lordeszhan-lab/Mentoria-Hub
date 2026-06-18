import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { resend, emailFrom } from "@/lib/email/resend";
import { weeklyDigestHtml } from "@/lib/email/templates";
import type { DeadlineRow, ProfileRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/digest
 *
 * For each opted-in user, composes and sends a weekly digest email
 * summarising upcoming deadlines, then inserts a notification.
 *
 * Also: announces last week's XP top learner via an achievement notification
 * (leaderboard refresh hook — no third cron needed).
 *
 * Runs weekly on Monday at 08:00 UTC.  Schedule: 0 8 * * 1
 * Guarded by Authorization: Bearer <CRON_SECRET>.
 * Idempotent: each run is a fresh weekly email (no sent-flag needed).
 * Sequential: users processed in chunks to respect Resend rate limits.
 * Never uses Promise.all for the outer fan-out.
 */

const CHUNK_SIZE = 10;

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  // ── Leaderboard: announce last week's top learner ─────────────────────────
  // Runs first (before digest fan-out) so a single DB query refreshes the
  // leaderboard window at the week boundary.  Non-fatal if it fails.
  try {
    await announceWeeklyWinner(db);
  } catch (err) {
    console.error("[cron:digest] leaderboard announcement error", err);
  }

  const { data: profiles } = (await db
    .from("profiles")
    .select("id, full_name")
    .eq("digest_optin", true)) as {
    data: Pick<ProfileRow, "id" | "full_name">[] | null;
  };

  if (!profiles?.length) {
    return NextResponse.json({ processed: 0, errors: 0 });
  }

  let processed = 0;
  let errors = 0;

  // Process sequentially in chunks — never blast all users at once
  for (let i = 0; i < profiles.length; i += CHUNK_SIZE) {
    const chunk = profiles.slice(i, i + CHUNK_SIZE);
    for (const profile of chunk) {
      try {
        await processDigest(db, profile);
        processed++;
      } catch (err) {
        console.error("[cron:digest] user error", profile.id, err);
        errors++;
      }
    }
  }

  return NextResponse.json({ processed, errors });
}

// ── Leaderboard: announce last week's top learner ────────────────────────────

/**
 * Queries xp_events for the PREVIOUS ISO week (the one that just ended on
 * Sunday) and sends an achievement notification to the student who earned the
 * most XP.  Called once per cron run — no third cron needed.
 *
 * If multiple students tie for first, only the first alphabetically is notified
 * (ties are rare; a friendly encouragement, not a scored prize).
 */
async function announceWeeklyWinner(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
): Promise<void> {
  // Compute the previous ISO week (Mon–Sun UTC) that just ended.
  // date_trunc('week', now()) in Postgres anchors to Monday 00:00 UTC.
  const now = new Date();
  const utcDay = now.getUTCDay();
  const daysSinceMon = (utcDay + 6) % 7;
  const thisMonday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMon),
  );
  const lastMonday = new Date(thisMonday.getTime() - 7 * 86_400_000);

  const { data: prevRows, error: prevError } = (await db
    .from("xp_events")
    .select("user_id, amount")
    .gte("created_at", lastMonday.toISOString())
    .lt("created_at", thisMonday.toISOString())) as {
    data: { user_id: string; amount: number }[] | null;
    error: unknown;
  };

  if (prevError || !prevRows?.length) return;

  // Aggregate by user
  const totals = new Map<string, number>();
  for (const row of prevRows) {
    totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + row.amount);
  }

  // Find the top earner
  let topUserId: string | null = null;
  let topXp = 0;
  for (const [uid, xp] of totals) {
    if (xp > topXp) { topXp = xp; topUserId = uid; }
  }

  if (!topUserId || topXp === 0) return;

  // Fetch their profile to confirm they're not an admin
  const { data: profile } = (await db
    .from("profiles")
    .select("role, full_name")
    .eq("id", topUserId)
    .single()) as { data: { role: string; full_name: string | null } | null };

  if (!profile || profile.role === "admin") return;

  const firstName = profile.full_name?.split(" ")[0] ?? "Student";

  await db.from("notifications").insert({
    user_id: topUserId,
    kind: "achievement",
    title: "Top learner last week!",
    body: `Amazing, ${firstName}! You earned ${topXp} XP last week — the most of anyone on Mentoria Hub. Keep it up!`,
    url: "/leaderboard",
  });
}

// ── Per-user digest helper ────────────────────────────────────────────────────

async function processDigest(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  profile: Pick<ProfileRow, "id" | "full_name">,
): Promise<void> {
  const userName = profile.full_name?.split(" ")[0] ?? "Student";

  // Upcoming deadlines in the next 7 days
  const now = new Date().toISOString();
  const in7d = new Date(Date.now() + 7 * 86_400_000).toISOString();

  const { data: deadlines } = (await db
    .from("deadlines")
    .select("title, due_at")
    .eq("user_id", profile.id)
    .gte("due_at", now)
    .lte("due_at", in7d)
    .order("due_at", { ascending: true })
    .limit(5)) as { data: Pick<DeadlineRow, "title" | "due_at">[] | null };

  // Resolve email address from auth
  const { data: authUser } = await db.auth.admin.getUserById(profile.id);
  const email: string | undefined = authUser?.user?.email;
  if (!email) return;

  // Send digest email (non-fatal)
  try {
    await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: "Your Mentoria Hub weekly digest",
      html: weeklyDigestHtml({ userName, deadlines: deadlines ?? [] }),
    });
  } catch (err) {
    console.error("[cron:digest] email error", profile.id, err);
  }

  // Insert in-app notification so it appears in the center
  await db.from("notifications").insert({
    user_id: profile.id,
    kind: "digest",
    title: "Weekly digest sent",
    body: "Your Mentoria Hub weekly summary is in your inbox.",
    url: "/dashboard",
  });
}
