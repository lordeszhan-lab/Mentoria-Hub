/**
 * Roadmap persistence layer.
 *
 * Upserts one `roadmaps` row per user (bumps version on regenerate),
 * replaces all `roadmap_steps`, and creates/refreshes `deadlines` rows
 * for steps that carry a deadline (for the calendar / reminders system).
 *
 * Initial step statuses: the first step (lowest order_index) in each grade
 * is set to "available"; all others are "locked".
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { RoadmapRow, RoadmapStepRow } from "@/lib/supabase/types";
import type { RoadmapOutput } from "@/lib/zod/roadmap";

const MODEL = "gpt-4o-mini";

export async function saveRoadmap(
  userId: string,
  output: RoadmapOutput,
): Promise<{ roadmapId: string } | { error: string }> {
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // ── 1. Find or create roadmap row ────────────────────────────────────────────

  const { data: existing } = (await db
    .from("roadmaps")
    .select("id, version")
    .eq("user_id", userId)
    .single()) as { data: Pick<RoadmapRow, "id" | "version"> | null };

  let roadmapId: string;
  let version: number;

  if (existing) {
    version = existing.version + 1;
    roadmapId = existing.id;

    const { error: updateError } = await db
      .from("roadmaps")
      .update({
        goal_snapshot: output.goal_summary,
        generated_at: new Date().toISOString(),
        model: MODEL,
        version,
      })
      .eq("id", roadmapId);

    if (updateError) return { error: updateError.message };
  } else {
    version = 1;

    const { data: inserted, error: insertError } = (await db
      .from("roadmaps")
      .insert({
        user_id: userId,
        goal_snapshot: output.goal_summary,
        generated_at: new Date().toISOString(),
        model: MODEL,
        version,
      })
      .select("id")
      .single()) as { data: { id: string } | null; error: { message: string } | null };

    if (insertError || !inserted) {
      return { error: insertError?.message ?? "Failed to insert roadmap" };
    }

    roadmapId = inserted.id;
  }

  // ── 2. Delete old steps ──────────────────────────────────────────────────────

  await db.from("roadmap_steps").delete().eq("roadmap_id", roadmapId);

  // ── 3. Compute initial statuses ──────────────────────────────────────────────
  //    Sort output steps by grade + order_index so the "first" step per grade
  //    is deterministic regardless of model output order.

  const sorted = [...output.steps].sort(
    (a, b) => a.grade - b.grade || a.order_index - b.order_index,
  );

  const seenGrades = new Set<number>();

  const stepsWithStatus = sorted.map((step) => {
    const isFirst = !seenGrades.has(step.grade);
    if (isFirst) seenGrades.add(step.grade);
    return {
      roadmap_id: roadmapId,
      grade: step.grade,
      term: step.term,
      order_index: step.order_index,
      title: step.title,
      rationale: step.rationale,
      kind: step.kind,
      opportunity_id: step.opportunity_id,
      course_id: step.course_id,
      deadline: step.deadline,
      match_score: step.match_score,
      // Per-grade first step = "available"; rest = "locked"
      status: (isFirst ? "available" : "locked") as RoadmapStepRow["status"],
    };
  });

  // ── 4. Insert steps ──────────────────────────────────────────────────────────

  const { data: insertedSteps, error: stepsError } = (await db
    .from("roadmap_steps")
    .insert(stepsWithStatus)
    .select("id, grade, title, deadline, opportunity_id")) as {
    data:
      | Pick<RoadmapStepRow, "id" | "grade" | "title" | "deadline" | "opportunity_id">[]
      | null;
    error: { message: string } | null;
  };

  if (stepsError) return { error: stepsError.message };

  // ── 5. Refresh deadline rows ─────────────────────────────────────────────────
  //    Delete old roadmap_step deadlines, then create new ones.

  await db
    .from("deadlines")
    .delete()
    .eq("user_id", userId)
    .eq("source_type", "roadmap_step");

  const deadlineInserts = (insertedSteps ?? [])
    .filter((s) => s.deadline != null)
    .map((s) => ({
      user_id: userId,
      source_type: "roadmap_step" as const,
      source_id: s.id,
      title: s.title,
      due_at: s.deadline!,
    }));

  if (deadlineInserts.length > 0) {
    const { error: deadlineError } = await db.from("deadlines").insert(deadlineInserts);
    if (deadlineError) {
      // Non-fatal: log and continue; step data is already saved
      console.error("[roadmap/save] deadline insert failed:", deadlineError.message);
    }
  }

  return { roadmapId };
}
