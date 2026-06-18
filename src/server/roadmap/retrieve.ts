/**
 * Roadmap context retrieval.
 *
 * Builds a compact, grounded context of REAL catalog ids that the generation
 * layer may reference. Uses vectorRank from Prompt 10 to surface the most
 * relevant opportunities across the student's remaining grades (current → 12).
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { rankByVector } from "@/server/reco/vectorRank";
import type { OpportunityRow, CourseRow, ProfileRow } from "@/lib/supabase/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContextOpportunity {
  id: string;
  title: string;
  type: string;
  category_id: string | null;
  deadline: string | null;
  min_grade: number | null;
  max_grade: number | null;
}

export interface ContextCourse {
  id: string;
  title: string;
  level: string;
  category_id: string | null;
  tags: string[];
}

export interface RoadmapContext {
  opportunities: ContextOpportunity[];
  courses: ContextCourse[];
}

export type RetrieveResult =
  | { ok: true; context: RoadmapContext; profile: ProfileRow }
  | { ok: false; error: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

const OPPORTUNITY_LIMIT = 25;
const COURSE_LIMIT = 15;

/** Parse the PostgREST-serialized pgvector string into a number array. */
function parseProfileVector(raw: string | null): number[] | null {
  if (!raw) return null;
  try {
    if (raw.startsWith("[")) {
      const arr = JSON.parse(raw) as unknown;
      if (Array.isArray(arr) && arr.length > 0) return arr as number[];
    }
    const parts = raw
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((s) => parseFloat(s.trim()));
    if (parts.length > 0 && !parts.some((n) => Number.isNaN(n))) return parts;
    return null;
  } catch {
    return null;
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Assemble the roadmap generation context for a user.
 *
 * Opportunities: multi-grade eligibility (any grade in [currentGrade..12]),
 * ranked by profile vector similarity (top 25).
 *
 * Courses: published courses filtered by profile interests/subjects (top 15).
 */
export async function retrieveRoadmapContext(
  userId: string,
): Promise<RetrieveResult> {
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 1. Load profile
  const { data: profile, error: profileError } = (await db
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()) as { data: ProfileRow | null; error: { message: string } | null };

  if (profileError || !profile) {
    return { ok: false, error: profileError?.message ?? "Profile not found" };
  }

  const currentGrade = profile.grade ?? 8;
  const now = Date.now();

  // 2. Load all published opportunities
  const { data: allOpps, error: oppsError } = (await db
    .from("opportunities")
    .select("*")
    .eq("status", "published")) as {
    data: OpportunityRow[] | null;
    error: { message: string } | null;
  };

  if (oppsError) return { ok: false, error: oppsError.message };

  // 3. Multi-grade eligibility: include opportunities relevant for ANY grade
  //    in [currentGrade..12]. Wider net than current-grade-only filterEligible.
  const futureRelevant = (allOpps ?? []).filter((opp) => {
    // Deadline must be null or in the future
    if (opp.deadline != null && new Date(opp.deadline).getTime() < now) return false;
    // Grade range must overlap with [currentGrade, 12]
    if (opp.min_grade != null && opp.min_grade > 12) return false;
    if (opp.max_grade != null && opp.max_grade < currentGrade) return false;
    return true;
  });

  // 4. Rank by profile vector (falls back to cold-start diversity if no vector)
  const profileVector = parseProfileVector(profile.profile_vector);
  const { ranked } = await rankByVector(profileVector, futureRelevant, OPPORTUNITY_LIMIT);

  const opportunities: ContextOpportunity[] = ranked.map((r) => ({
    id: r.opportunity.id,
    title: r.opportunity.title,
    type: r.opportunity.type,
    category_id: r.opportunity.category_id,
    deadline: r.opportunity.deadline,
    min_grade: r.opportunity.min_grade,
    max_grade: r.opportunity.max_grade,
  }));

  // 5. Load published courses
  const { data: allCourses } = (await db
    .from("courses")
    .select("id, title, level, category_id, tags, status")
    .eq("status", "published")) as {
    data: (Pick<CourseRow, "id" | "title" | "level" | "category_id" | "tags" | "status">)[] | null;
  };

  const userInterests = (profile.interests ?? []).map((s) => s.toLowerCase());
  const userSubjects = (profile.subjects ?? []).map((s) => s.toLowerCase());

  const filteredCourses: ContextCourse[] = (allCourses ?? [])
    .filter((c) => {
      // When profile has no interests/subjects, include all courses
      if (!userInterests.length && !userSubjects.length) return true;
      const tags = (c.tags ?? []).map((t) => t.toLowerCase());
      return (
        userInterests.some((i) => tags.some((t) => t.includes(i) || i.includes(t))) ||
        userSubjects.some((s) => tags.some((t) => t.includes(s) || s.includes(t)))
      );
    })
    .slice(0, COURSE_LIMIT)
    .map((c) => ({
      id: c.id,
      title: c.title,
      level: c.level,
      category_id: c.category_id,
      tags: c.tags ?? [],
    }));

  return {
    ok: true,
    context: { opportunities, courses: filteredCourses },
    profile,
  };
}
