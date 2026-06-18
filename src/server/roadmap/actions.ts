/**
 * Server actions for the Roadmap Engine.
 *
 * generateRoadmap  — retrieve context → generate → persist → return data
 * setStepStatus    — update a single step's status; optionally unlock next step
 * getRoadmapData   — load roadmap + steps + linked opportunity/course previews
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { retrieveRoadmapContext } from "./retrieve";
import { generateRoadmap } from "./generate";
import { saveRoadmap } from "./save";
import { awardXp, touchStreak } from "@/server/gamification/actions";
import { XP_STEP_DONE } from "@/lib/constants";
import type {
  RoadmapRow,
  RoadmapStepRow,
  RoadmapStepStatus,
  OpportunityRow,
  CourseRow,
} from "@/lib/supabase/types";

// ── Shared types ──────────────────────────────────────────────────────────────

export interface LinkedOpportunity {
  title: string;
  slug: string;
  apply_url: string | null;
  category_id: string | null;
}

export interface LinkedCourse {
  title: string;
  slug: string;
  category_id: string | null;
}

export interface StepWithLinks extends RoadmapStepRow {
  opportunity?: LinkedOpportunity;
  course?: LinkedCourse;
}

export interface RoadmapData {
  roadmap: RoadmapRow;
  steps: StepWithLinks[];
  profileUpdatedAt: string;
}

// ── Auth helper ───────────────────────────────────────────────────────────────

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/login");
  return user;
}

// ── generateRoadmap ───────────────────────────────────────────────────────────

export async function generateRoadmapAction(): Promise<
  { data: RoadmapData } | { error: string }
> {
  const user = await requireUser();

  // 1. Retrieve grounded context
  const retrieved = await retrieveRoadmapContext(user.id);
  if (!retrieved.ok) return { error: retrieved.error };
  const { context, profile } = retrieved;

  // 2. Generate
  const generated = await generateRoadmap(profile, context);
  if ("error" in generated) return { error: generated.error };

  // 3. Persist
  const saved = await saveRoadmap(user.id, generated.output);
  if ("error" in saved) return { error: saved.error };

  // 4. Return fresh data
  const loaded = await getRoadmapDataAction();
  return loaded;
}

// ── getRoadmapData ────────────────────────────────────────────────────────────

export async function getRoadmapDataAction(): Promise<
  { data: RoadmapData } | { error: string }
> {
  const user = await requireUser();
  return loadRoadmapForUser(user.id);
}

/** Shared loader — called by getRoadmapDataAction and server page.tsx. */
export async function loadRoadmapForUser(
  userId: string,
): Promise<{ data: RoadmapData } | { error: string }> {
  const adminDb = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminDb as any;

  // Load roadmap
  const { data: roadmap, error: roadmapError } = (await db
    .from("roadmaps")
    .select("*")
    .eq("user_id", userId)
    .single()) as { data: RoadmapRow | null; error: { message: string } | null };

  if (roadmapError || !roadmap) {
    return { error: roadmapError?.message ?? "No roadmap found" };
  }

  // Load steps
  const { data: steps, error: stepsError } = (await db
    .from("roadmap_steps")
    .select("*")
    .eq("roadmap_id", roadmap.id)
    .order("grade", { ascending: true })
    .order("order_index", { ascending: true })) as {
    data: RoadmapStepRow[] | null;
    error: { message: string } | null;
  };

  if (stepsError) return { error: stepsError.message };

  const stepRows = steps ?? [];

  // Batch load linked opportunities
  const oppIds = [...new Set(stepRows.map((s) => s.opportunity_id).filter(Boolean))] as string[];
  const courseIds = [...new Set(stepRows.map((s) => s.course_id).filter(Boolean))] as string[];

  const [oppResult, courseResult, profileResult] = await Promise.all([
    oppIds.length > 0
      ? (db
          .from("opportunities")
          .select("id, title, slug, apply_url, category_id")
          .in("id", oppIds) as Promise<{
          data: Pick<OpportunityRow, "id" | "title" | "slug" | "apply_url" | "category_id">[] | null;
        }>)
      : Promise.resolve({ data: [] as Pick<OpportunityRow, "id" | "title" | "slug" | "apply_url" | "category_id">[] }),
    courseIds.length > 0
      ? (db
          .from("courses")
          .select("id, title, slug, category_id")
          .in("id", courseIds) as Promise<{
          data: Pick<CourseRow, "id" | "title" | "slug" | "category_id">[] | null;
        }>)
      : Promise.resolve({ data: [] as Pick<CourseRow, "id" | "title" | "slug" | "category_id">[] }),
    db
      .from("profiles")
      .select("updated_at")
      .eq("id", userId)
      .single() as Promise<{ data: { updated_at: string } | null }>,
  ]);

  const oppMap = new Map(
    (oppResult.data ?? []).map((o) => [
      o.id,
      { title: o.title, slug: o.slug, apply_url: o.apply_url, category_id: o.category_id },
    ]),
  );
  const courseMap = new Map(
    (courseResult.data ?? []).map((c) => [
      c.id,
      { title: c.title, slug: c.slug, category_id: c.category_id },
    ]),
  );

  const stepsWithLinks: StepWithLinks[] = stepRows.map((step) => ({
    ...step,
    opportunity: step.opportunity_id ? oppMap.get(step.opportunity_id) : undefined,
    course: step.course_id ? courseMap.get(step.course_id) : undefined,
  }));

  const profileUpdatedAt = profileResult.data?.updated_at ?? new Date().toISOString();

  return { data: { roadmap, steps: stepsWithLinks, profileUpdatedAt } };
}

// ── setStepStatus ─────────────────────────────────────────────────────────────

export async function setStepStatusAction(
  stepId: string,
  status: RoadmapStepStatus,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireUser();

  const adminDb = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminDb as any;

  // Verify the step belongs to this user's roadmap
  const { data: step } = (await db
    .from("roadmap_steps")
    .select("id, roadmap_id, grade, order_index, status")
    .eq("id", stepId)
    .single()) as { data: Pick<RoadmapStepRow, "id" | "roadmap_id" | "grade" | "order_index" | "status"> | null };

  if (!step) return { error: "Step not found" };

  const { data: roadmap } = (await db
    .from("roadmaps")
    .select("id, user_id")
    .eq("id", step.roadmap_id)
    .single()) as { data: Pick<RoadmapRow, "id" | "user_id"> | null };

  if (!roadmap || roadmap.user_id !== user.id) return { error: "Unauthorized" };

  // Update step status
  const { error: updateError } = await db
    .from("roadmap_steps")
    .update({ status })
    .eq("id", stepId);

  if (updateError) return { error: updateError.message };

  // When a step is marked done, optionally unlock the next locked step in the
  // same grade (the step with the next-higher order_index).
  if (status === "done") {
    const { data: nextLocked } = (await db
      .from("roadmap_steps")
      .select("id")
      .eq("roadmap_id", step.roadmap_id)
      .eq("grade", step.grade)
      .eq("status", "locked")
      .gt("order_index", step.order_index)
      .order("order_index", { ascending: true })
      .limit(1)
      .single()) as { data: { id: string } | null };

    if (nextLocked) {
      await db
        .from("roadmap_steps")
        .update({ status: "available" })
        .eq("id", nextLocked.id);
    }

    // Award XP + update streak for completing a roadmap step
    await Promise.all([
      awardXp(user.id, XP_STEP_DONE, `step_done:${stepId}`),
      touchStreak(user.id),
    ]);
    revalidatePath("/roadmap");
  }

  return { ok: true };
}
