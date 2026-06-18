import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadRoadmapForUser } from "@/server/roadmap/actions";
import { getRecommendations } from "@/server/reco/getRecommendations";
import { getUpcomingDeadlines } from "@/server/deadlines/get";
import { DashboardWidgets } from "./dashboard-widgets";
import type {
  ProfileRow,
  CourseRow,
  OpportunityRow,
  EnrollmentRow,
  LessonProgressRow,
  ModuleRow,
  LessonRow,
  SavedOpportunityRow,
  DeadlineRow,
} from "@/lib/supabase/types";

/**
 * Dashboard page — fetches all widget data in parallel, then delegates to
 * the client DashboardWidgets component for animations.
 *
 * Widgets: 1. Hero Next move  2. My roadmap  3. Active courses
 *          4. Saved opps      5. Deadlines    6. Recommended  7. Progress & streak
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createAdminClient() as any;

  // ── Fetch all top-level data in parallel ─────────────────────────────────

  const [
    profileResult,
    roadmapResult,
    enrollmentsResult,
    savedResult,
    deadlines,
    recoResult,
  ] = await Promise.all([
    db
      .from("profiles")
      .select(
        "id, full_name, xp, streak_count, streak_last_active, calendar_token, onboarding_completed",
      )
      .eq("id", user.id)
      .single() as Promise<{
      data: Pick<
        ProfileRow,
        | "id"
        | "full_name"
        | "xp"
        | "streak_count"
        | "streak_last_active"
        | "calendar_token"
        | "onboarding_completed"
      > | null;
    }>,

    loadRoadmapForUser(user.id).catch(
      (): { error: string } => ({ error: "load_failed" }),
    ),

    db
      .from("enrollments")
      .select("course_id, enrolled_at")
      .eq("user_id", user.id) as Promise<{
      data: Pick<EnrollmentRow, "course_id" | "enrolled_at">[] | null;
    }>,

    db
      .from("saved_opportunities")
      .select("opportunity_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6) as Promise<{
      data: Pick<SavedOpportunityRow, "opportunity_id" | "created_at">[] | null;
    }>,

    getUpcomingDeadlines(user.id).catch((): DeadlineRow[] => []),

    getRecommendations(user.id).catch(() => ({
      items: [] as Awaited<ReturnType<typeof getRecommendations>>["items"],
      coldStart: false,
    })),
  ]);

  const profile = profileResult.data;
  if (!profile?.onboarding_completed) redirect("/onboarding");

  // ── Enrolled courses + per-course progress ───────────────────────────────

  const enrolledCourseIds = (enrollmentsResult.data ?? []).map((e) => e.course_id);

  type CourseWithProgress = CourseRow & {
    progressPct: number;
    completedLessons: number;
    totalLessons: number;
    nextLessonId: string | null;
  };

  let coursesWithProgress: CourseWithProgress[] = [];

  if (enrolledCourseIds.length > 0) {
    const [coursesResult, modulesResult] = await Promise.all([
      adminDb
        .from("courses")
        .select("*")
        .in("id", enrolledCourseIds)
        .eq("status", "published") as Promise<{ data: CourseRow[] | null }>,
      adminDb
        .from("modules")
        .select("id, course_id, order_index")
        .in("course_id", enrolledCourseIds)
        .order("order_index", { ascending: true }) as Promise<{
        data: Pick<ModuleRow, "id" | "course_id" | "order_index">[] | null;
      }>,
    ]);

    const courseRows = coursesResult.data ?? [];
    const moduleRows = modulesResult.data ?? [];
    const moduleIds = moduleRows.map((m) => m.id);

    const [lessonsResult, progressResult] = await Promise.all([
      moduleIds.length > 0
        ? (adminDb
            .from("lessons")
            .select("id, module_id, order_index")
            .in("module_id", moduleIds)
            .order("order_index", { ascending: true }) as Promise<{
            data: Pick<LessonRow, "id" | "module_id" | "order_index">[] | null;
          }>)
        : Promise.resolve({
            data: [] as Pick<LessonRow, "id" | "module_id" | "order_index">[],
          }),
      moduleIds.length > 0
        ? (db
            .from("lesson_progress")
            .select("lesson_id, status")
            .eq("user_id", user.id) as Promise<{
            data: Pick<LessonProgressRow, "lesson_id" | "status">[] | null;
          }>)
        : Promise.resolve({
            data: [] as Pick<LessonProgressRow, "lesson_id" | "status">[],
          }),
    ]);

    const lessonRows = lessonsResult.data ?? [];
    const progressRows = progressResult.data ?? [];
    const completedSet = new Set(
      progressRows.filter((p) => p.status === "completed").map((p) => p.lesson_id),
    );

    // courseId → ordered moduleIds
    const modulesByCourse = new Map<string, string[]>();
    for (const m of moduleRows) {
      const list = modulesByCourse.get(m.course_id) ?? [];
      list.push(m.id);
      modulesByCourse.set(m.course_id, list);
    }

    // moduleId → ordered lessons
    const lessonsByModule = new Map<string, typeof lessonRows>();
    for (const l of lessonRows) {
      const list = lessonsByModule.get(l.module_id) ?? [];
      list.push(l);
      lessonsByModule.set(l.module_id, list);
    }

    const moduleOrderMap = new Map(moduleRows.map((m, i) => [m.id, i]));

    coursesWithProgress = courseRows.map((course) => {
      const mIds = modulesByCourse.get(course.id) ?? [];
      const allLessons = mIds
        .flatMap((mId) => lessonsByModule.get(mId) ?? [])
        .sort((a, b) => {
          const mDiff =
            (moduleOrderMap.get(a.module_id) ?? 0) -
            (moduleOrderMap.get(b.module_id) ?? 0);
          return mDiff !== 0 ? mDiff : a.order_index - b.order_index;
        });

      const total = allLessons.length;
      const completed = allLessons.filter((l) => completedSet.has(l.id)).length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      const nextLesson = allLessons.find((l) => !completedSet.has(l.id)) ?? null;

      return {
        ...course,
        progressPct: pct,
        completedLessons: completed,
        totalLessons: total,
        nextLessonId: nextLesson?.id ?? null,
      };
    });
  }

  // ── Saved opportunities ──────────────────────────────────────────────────

  const savedOppIds = (savedResult.data ?? []).map((s) => s.opportunity_id);
  let savedOpps: OpportunityRow[] = [];

  if (savedOppIds.length > 0) {
    const { data } = (await adminDb
      .from("opportunities")
      .select("*")
      .in("id", savedOppIds)
      .eq("status", "published")) as { data: OpportunityRow[] | null };
    savedOpps = data ?? [];
  }

  // ── Roadmap ───────────────────────────────────────────────────────────────

  const roadmap = "data" in roadmapResult ? roadmapResult.data : null;

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalCompletedLessons = coursesWithProgress.reduce(
    (acc, c) => acc + c.completedLessons,
    0,
  );
  const totalStepsDone = roadmap
    ? roadmap.steps.filter((s) => s.status === "done").length
    : 0;

  // ── Recommendations (top 3) ───────────────────────────────────────────────

  const topRecos = recoResult.items.slice(0, 3);

  // ── Deadline urgency enrichment ───────────────────────────────────────────

  const now = Date.now();
  const enrichedDeadlines = deadlines.map((d) => ({
    ...d,
    daysLeft: Math.ceil((new Date(d.due_at).getTime() - now) / 86_400_000),
  }));

  return (
    <DashboardWidgets
      profile={{
        full_name: profile.full_name,
        xp: profile.xp,
        streak_count: profile.streak_count,
        streak_last_active: profile.streak_last_active,
        calendar_token: profile.calendar_token,
      }}
      roadmap={roadmap}
      courses={coursesWithProgress}
      savedOpps={savedOpps}
      deadlines={enrichedDeadlines}
      recommendations={topRecos.map((r) => ({
        id: r.opportunity.id,
        title: r.opportunity.title,
        slug: r.opportunity.slug,
        type: r.opportunity.type,
        deadline: r.opportunity.deadline,
        matchScore: r.matchScore,
        reasons: r.reasons,
      }))}
      stats={{
        totalCompletedLessons,
        totalStepsDone,
        totalSteps: roadmap?.steps.length ?? 0,
      }}
    />
  );
}
