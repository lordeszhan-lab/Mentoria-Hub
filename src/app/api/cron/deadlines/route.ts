import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPush } from "@/server/notifications/push";
import { resend, emailFrom } from "@/lib/email/resend";
import { deadlineReminderHtml } from "@/lib/email/templates";
import type { DeadlineRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/deadlines
 *
 * Scans deadlines due in ~14 days and ~2 days where the respective sent
 * flag is false. For each: sends a reminder email (+ optional push),
 * inserts a notification, then flips the flag.
 *
 * Runs every 4 hours.  Cron expression: 0 (star)/4 (star) (star) (star)
 * Guarded by Authorization: Bearer <CRON_SECRET>.
 * Idempotent: double-checks each flag before sending.
 */
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const now = Date.now();

  const window14Min = new Date(now + 13 * 86_400_000).toISOString();
  const window14Max = new Date(now + 15 * 86_400_000).toISOString();
  const window2Min = new Date(now + 1 * 86_400_000).toISOString();
  const window2Max = new Date(now + 3 * 86_400_000).toISOString();

  const [{ data: deadlines14 }, { data: deadlines2 }] = await Promise.all([
    db
      .from("deadlines")
      .select("*")
      .eq("remind_14d_sent", false)
      .gte("due_at", window14Min)
      .lte("due_at", window14Max) as Promise<{ data: DeadlineRow[] | null }>,
    db
      .from("deadlines")
      .select("*")
      .eq("remind_2d_sent", false)
      .gte("due_at", window2Min)
      .lte("due_at", window2Max) as Promise<{ data: DeadlineRow[] | null }>,
  ]);

  let processed = 0;
  let errors = 0;

  for (const deadline of deadlines14 ?? []) {
    try {
      await processReminder(db, deadline, 14);
      processed++;
    } catch (err) {
      console.error("[cron:deadlines] 14d error", deadline.id, err);
      errors++;
    }
  }

  for (const deadline of deadlines2 ?? []) {
    try {
      await processReminder(db, deadline, 2);
      processed++;
    } catch (err) {
      console.error("[cron:deadlines] 2d error", deadline.id, err);
      errors++;
    }
  }

  return NextResponse.json({ processed, errors });
}

// ── Per-deadline helper ───────────────────────────────────────────────────────

async function processReminder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  deadline: DeadlineRow,
  daysUntil: 14 | 2,
): Promise<void> {
  const flagField = daysUntil === 14 ? "remind_14d_sent" : "remind_2d_sent";

  // Idempotent guard: re-read the flag to prevent double-sends if cron overlaps
  const { data: fresh } = (await db
    .from("deadlines")
    .select(flagField)
    .eq("id", deadline.id)
    .single()) as { data: Record<string, boolean> | null };

  if (fresh?.[flagField]) return;

  // Get the user's profile (name + email opt-in)
  const { data: profile } = (await db
    .from("profiles")
    .select("full_name, email_optin")
    .eq("id", deadline.user_id)
    .single()) as {
    data: { full_name: string | null; email_optin: boolean } | null;
  };

  // Resolve email address from auth
  const { data: authUser } = await db.auth.admin.getUserById(deadline.user_id);
  const email: string | undefined = authUser?.user?.email;
  const userName = profile?.full_name?.split(" ")[0] ?? "Student";

  // Send email (non-fatal)
  if (profile?.email_optin && email) {
    try {
      await resend.emails.send({
        from: emailFrom,
        to: email,
        subject: `${daysUntil === 2 ? "⚠️ " : ""}Deadline in ${daysUntil} days: ${deadline.title}`,
        html: deadlineReminderHtml({
          userName,
          deadlineTitle: deadline.title,
          daysUntil,
          dueAt: deadline.due_at,
        }),
      });
    } catch (err) {
      console.error("[cron:deadlines] email error", deadline.id, err);
    }
  }

  // Send push (non-fatal)
  await sendPush(deadline.user_id, {
    title: `Deadline in ${daysUntil} days`,
    body: deadline.title,
    url: "/dashboard",
  }).catch((err) => console.error("[cron:deadlines] push error", deadline.id, err));

  // Insert in-app notification
  await db.from("notifications").insert({
    user_id: deadline.user_id,
    kind: "deadline",
    title: `Deadline in ${daysUntil} days`,
    body: `${deadline.title} is due in approximately ${daysUntil} days.`,
    url: "/dashboard",
  });

  // Flip the flag — idempotent final step
  await db
    .from("deadlines")
    .update({ [flagField]: true })
    .eq("id", deadline.id);
}
