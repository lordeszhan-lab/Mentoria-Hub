"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { awardXp, touchStreak } from "@/server/gamification/actions";
import { XP_LESSON_COMPLETED, XP_QUIZ_PASSED } from "@/lib/constants";
import type {
  LessonStatus,
  EnrollmentRow,
  LessonProgressRow,
  ModuleRow,
  LessonRow,
  QuizRow,
} from "@/lib/supabase/types";
import type { CertificateRow } from "@/lib/supabase/types";

// ── Quiz question shape (stored as JSON in quizzes.questions) ─────────────────

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  correct_option_id: string;
  explanation?: string;
}

// ── Action return types ───────────────────────────────────────────────────────

export interface EnrollResult {
  error?: string;
  lessonId?: string;
  courseSlug?: string;
}

export interface MarkCompleteResult {
  error?: string;
  xpAwarded?: number;
  /** Set when marking the last lesson triggers certificate issuance */
  certificate?: CertificateRow;
}

export interface QuizSubmitResult {
  error?: string;
  score?: number;         // 0–100
  passed?: boolean;
  xpAwarded?: number;
  results?: {
    questionId: string;
    correct: boolean;
    selectedOptionId: string;
    correctOptionId: string;
    explanation?: string;
  }[];
}

// ── enroll ────────────────────────────────────────────────────────────────────

/**
 * Enrol the current user in a course, then redirect to the first incomplete lesson.
 * If already enrolled, redirect to the first incomplete lesson.
 */
export async function enroll(courseId: string): Promise<never> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch the course slug for the redirect target.
  const { data: course } = (await db
    .from("courses")
    .select("slug")
    .eq("id", courseId)
    .single()) as { data: { slug: string } | null };

  if (!course) redirect("/courses");

  // Upsert enrollment (idempotent).
  await db.from("enrollments").upsert(
    { user_id: user.id, course_id: courseId, enrolled_at: new Date().toISOString() },
    { onConflict: "user_id,course_id" },
  );

  // Find the first lesson of this course (by module order_index then lesson order_index).
  const { data: modules } = (await db
    .from("modules")
    .select("id, order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true })) as { data: ModuleRow[] | null };

  if (!modules?.length) redirect(`/courses/${course.slug}`);

  const moduleIds = modules.map((m) => m.id);

  const { data: allLessons } = (await db
    .from("lessons")
    .select("id, module_id, order_index")
    .in("module_id", moduleIds)
    .order("order_index", { ascending: true })) as {
    data: Pick<LessonRow, "id" | "module_id" | "order_index">[] | null;
  };

  if (!allLessons?.length) redirect(`/courses/${course.slug}`);

  // Sort lessons: module order first, then lesson order within module.
  const moduleOrder = Object.fromEntries(modules.map((m, i) => [m.id, i]));
  const sorted = [...allLessons].sort((a, b) => {
    const mDiff = (moduleOrder[a.module_id] ?? 0) - (moduleOrder[b.module_id] ?? 0);
    if (mDiff !== 0) return mDiff;
    return a.order_index - b.order_index;
  });

  // Fetch completion data for this user.
  const { data: progress } = (await db
    .from("lesson_progress")
    .select("lesson_id, status")
    .eq("user_id", user.id)
    .in(
      "lesson_id",
      sorted.map((l) => l.id),
    )) as { data: Pick<LessonProgressRow, "lesson_id" | "status">[] | null };

  const completedSet = new Set((progress ?? []).filter((p) => p.status === "completed").map((p) => p.lesson_id));

  const firstIncomplete = sorted.find((l) => !completedSet.has(l.id)) ?? sorted[0];

  redirect(`/courses/${course.slug}/lessons/${firstIncomplete.id}`);
}

// ── markLessonComplete ────────────────────────────────────────────────────────

/**
 * Mark a lesson as completed for the current user.
 * Awards XP and updates the streak via the centralised gamification module.
 * If this lesson completes the entire course, issues a certificate.
 */
export async function markLessonComplete(lessonId: string): Promise<MarkCompleteResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const now = new Date().toISOString();

  const { error: progErr } = await db.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      status: "completed" as LessonStatus,
      completed_at: now,
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (progErr) return { error: progErr.message };

  // Fire-and-forget gamification — never blocks the user
  await Promise.all([
    awardXp(user.id, XP_LESSON_COMPLETED, `lesson_complete:${lessonId}`),
    touchStreak(user.id),
  ]);

  revalidatePath("/courses", "layout");

  // Check whether this lesson belongs to a course that is now 100% complete
  // and, if so, issue the certificate.
  let certificate: CertificateRow | undefined;
  try {
    const { data: lessonModule } = (await db
      .from("lessons")
      .select("module_id")
      .eq("id", lessonId)
      .single()) as { data: { module_id: string } | null };

    if (lessonModule) {
      const { data: mod } = (await db
        .from("modules")
        .select("course_id")
        .eq("id", lessonModule.module_id)
        .single()) as { data: { course_id: string } | null };

      if (mod) {
        const { issueCertificate } = await import("@/server/courses/certificates");
        const result = await issueCertificate(mod.course_id);
        if (result.certificate) certificate = result.certificate;
      }
    }
  } catch {
    // Non-fatal — never block lesson completion due to certificate errors
  }

  return { xpAwarded: XP_LESSON_COMPLETED, ...(certificate ? { certificate } : {}) };
}

// ── submitQuiz ────────────────────────────────────────────────────────────────

const QUIZ_PASS_THRESHOLD = 70; // %

/**
 * Score a quiz submission entirely server-side.
 * Never trust client-provided correctness data.
 */
export async function submitQuiz(
  lessonId: string,
  answers: Record<string, string>, // { questionId: selectedOptionId }
): Promise<QuizSubmitResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch quiz from DB (authoritative).
  const { data: quizRow } = (await db
    .from("quizzes")
    .select("*")
    .eq("lesson_id", lessonId)
    .single()) as { data: QuizRow | null };

  if (!quizRow) return { error: "Quiz not found" };

  const questions = quizRow.questions as unknown as QuizQuestion[];

  if (!Array.isArray(questions) || questions.length === 0) {
    return { error: "Invalid quiz data" };
  }

  // Score each question.
  const results = questions.map((q) => {
    const selected = answers[q.id] ?? "";
    const correct = selected === q.correct_option_id;
    return {
      questionId: q.id,
      correct,
      selectedOptionId: selected,
      correctOptionId: q.correct_option_id,
      explanation: q.explanation,
    };
  });

  const correctCount = results.filter((r) => r.correct).length;
  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= QUIZ_PASS_THRESHOLD;

  // Persist quiz_score in lesson_progress.
  await db.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      status: passed ? ("completed" as LessonStatus) : ("in_progress" as LessonStatus),
      quiz_score: score,
      completed_at: passed ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (passed) {
    // Fire-and-forget gamification for quiz pass
    await Promise.all([
      awardXp(user.id, XP_QUIZ_PASSED, `quiz_passed:${lessonId}`),
      touchStreak(user.id),
    ]);
    revalidatePath("/courses", "layout");
    return { score, passed, results, xpAwarded: XP_QUIZ_PASSED };
  }

  return { score, passed, results };
}

// ── getCourseProgress ─────────────────────────────────────────────────────────

/**
 * Returns { totalLessons, completedLessons, progressPct } for a user+course pair.
 * Used by the catalog and detail pages.
 */
export async function getCourseProgress(
  userId: string,
  courseId: string,
): Promise<{ totalLessons: number; completedLessons: number; progressPct: number }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: modules } = (await db
    .from("modules")
    .select("id")
    .eq("course_id", courseId)) as { data: Pick<ModuleRow, "id">[] | null };

  if (!modules?.length) return { totalLessons: 0, completedLessons: 0, progressPct: 0 };

  const moduleIds = modules.map((m) => m.id);

  const { data: lessons, count: totalLessons } = (await db
    .from("lessons")
    .select("id", { count: "exact" })
    .in("module_id", moduleIds)) as { data: Pick<LessonRow, "id">[] | null; count: number | null };

  const total = totalLessons ?? 0;
  if (total === 0) return { totalLessons: 0, completedLessons: 0, progressPct: 0 };

  const lessonIds = (lessons ?? []).map((l) => l.id);

  const { count: completedCount } = (await db
    .from("lesson_progress")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("status", "completed")
    .in("lesson_id", lessonIds)) as { count: number | null };

  const completed = completedCount ?? 0;
  return {
    totalLessons: total,
    completedLessons: completed,
    progressPct: Math.round((completed / total) * 100),
  };
}

// ── getEnrolledCourseIds ──────────────────────────────────────────────────────

export async function getEnrolledCourseIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data } = (await db
    .from("enrollments")
    .select("course_id")
    .eq("user_id", userId)) as { data: Pick<EnrollmentRow, "course_id">[] | null };

  return (data ?? []).map((e) => e.course_id);
}
