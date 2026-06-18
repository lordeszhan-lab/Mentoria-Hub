import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  Lock,
  PlayCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCourseProgress, getEnrolledCourseIds } from "@/server/courses/actions";
import { EnrollButton } from "./enroll-button";
import type {
  CourseRow,
  CategoryRow,
  ModuleRow,
  LessonRow,
  LessonProgressRow,
} from "@/lib/supabase/types";
import { CATEGORY_MAP } from "@/lib/categories";

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // ── Course ────────────────────────────────────────────────────────────────

  const { data: courseRaw } = (await db
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single()) as { data: CourseRow | null };

  if (!courseRaw) notFound();
  const course = courseRaw;

  // ── Category ──────────────────────────────────────────────────────────────

  const { data: category } = (await db
    .from("categories")
    .select("*")
    .eq("id", course.category_id ?? "")
    .single()) as { data: CategoryRow | null };

  const catMeta = category
    ? CATEGORY_MAP[category.slug as keyof typeof CATEGORY_MAP] ?? null
    : null;

  // ── Modules + lessons ─────────────────────────────────────────────────────

  const { data: modules } = (await db
    .from("modules")
    .select("*")
    .eq("course_id", course.id)
    .order("order_index", { ascending: true })) as { data: ModuleRow[] | null };

  const moduleList = modules ?? [];
  const moduleIds = moduleList.map((m) => m.id);

  const lessonsByModule: Record<string, LessonRow[]> = {};
  if (moduleIds.length > 0) {
    const { data: lessons } = (await db
      .from("lessons")
      .select("*")
      .in("module_id", moduleIds)
      .order("order_index", { ascending: true })) as { data: LessonRow[] | null };

    for (const lesson of lessons ?? []) {
      if (!lessonsByModule[lesson.module_id]) lessonsByModule[lesson.module_id] = [];
      lessonsByModule[lesson.module_id].push(lesson);
    }
  }

  const allLessons = moduleList.flatMap((m) => lessonsByModule[m.id] ?? []);
  const totalLessons = allLessons.length;

  // ── Enrollment & progress ─────────────────────────────────────────────────

  const enrolledIds = await getEnrolledCourseIds(user.id);
  const isEnrolled = enrolledIds.includes(course.id);

  const { completedLessons, progressPct } = isEnrolled
    ? await getCourseProgress(user.id, course.id)
    : { completedLessons: 0, progressPct: 0 };

  const completedSet = new Set<string>();
  if (isEnrolled && allLessons.length > 0) {
    const { data: progRows } = (await db
      .from("lesson_progress")
      .select("lesson_id, status")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .in(
        "lesson_id",
        allLessons.map((l) => l.id),
      )) as { data: Pick<LessonProgressRow, "lesson_id" | "status">[] | null };

    for (const p of progRows ?? []) completedSet.add(p.lesson_id);
  }

  const firstIncomplete = allLessons.find((l) => !completedSet.has(l.id)) ?? allLessons[0];

  const estimatedH = course.estimated_minutes
    ? course.estimated_minutes < 60
      ? `${course.estimated_minutes}m`
      : `${Math.round(course.estimated_minutes / 60)}h`
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[--color-canvas]">
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-8 lg:px-8">

        {/* Back */}
        <Link
          href="/courses"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[--color-fg-muted] transition-colors hover:text-[--color-brand]"
        >
          <ArrowLeft className="size-4" strokeWidth={1.6} />
          All courses
        </Link>

        {/* ── Premium calm hero card (no loud color fill) ── */}
        <div
          className="rounded-2xl bg-[--color-surface] p-7 shadow-card"
          style={{ border: "1px solid var(--color-border)" }}
        >
          {/* Icon chip — onboarding pattern */}
          <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-brand-soft">
            <BookOpen size={20} strokeWidth={1.6} className="text-[--color-brand]" />
          </div>

          {/* Meta pills */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center h-5 px-2 rounded-full border border-[--color-border] text-[11px] font-medium text-[--color-fg-muted]">
              {LEVEL_LABELS[course.level] ?? course.level}
            </span>
            {catMeta && (
              <span
                className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-semibold"
                style={{ background: `${catMeta.chipInk}14`, color: catMeta.chipInk }}
              >
                <catMeta.Icon size={10} strokeWidth={1.6} aria-hidden />
                {catMeta.name}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-[--color-fg]">
            {course.title}
          </h1>

          {/* Description */}
          {course.description && (
            <p className="mt-2 text-sm leading-relaxed text-[--color-fg-muted]">
              {course.description}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[--color-fg-muted]">
            {totalLessons > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Layers className="size-4" strokeWidth={1.6} />
                {totalLessons} lesson{totalLessons === 1 ? "" : "s"}
              </span>
            )}
            {estimatedH && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" strokeWidth={1.6} />
                ~{estimatedH}
              </span>
            )}
          </div>
        </div>

        {/* ── Progress card (enrolled) ── */}
        {isEnrolled && totalLessons > 0 && (
          <div
            className="mt-4 rounded-2xl bg-[--color-surface] p-5 shadow-card"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <div className="mb-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-[--color-fg-muted]">Your progress</span>
              <span className="text-[--color-brand]">
                {completedLessons}/{totalLessons} lessons
              </span>
            </div>
            {/* Slim progress bar */}
            <div className="h-1.5 overflow-hidden rounded-full bg-[--color-surface-2]">
              <div
                className="h-full rounded-full bg-brand transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {firstIncomplete && (
              <Link
                href={`/courses/${slug}/lessons/${firstIncomplete.id}`}
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-semibold text-white bg-brand hover:bg-brand-strong active:scale-[0.99] transition-all duration-200"
              >
                {progressPct === 0 ? "Start course" : progressPct === 100 ? "Review" : "Continue"}
              </Link>
            )}
          </div>
        )}

        {/* ── Enroll CTA (not enrolled) ── */}
        {!isEnrolled && (
          <div className="mt-4">
            <EnrollButton courseId={course.id} />
          </div>
        )}

        {/* ── Module/Lesson list ── */}
        {moduleList.length > 0 && (
          <div className="mt-6 space-y-3">
            {moduleList.map((mod, modIdx) => {
              const lessons = lessonsByModule[mod.id] ?? [];
              const modCompleted = lessons.filter((l) => completedSet.has(l.id)).length;

              return (
                <div
                  key={mod.id}
                  className="rounded-2xl bg-[--color-surface] shadow-card overflow-hidden"
                  style={{ border: "1px solid var(--color-border)" }}
                >
                  {/* Module header */}
                  <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[--color-border] bg-[--color-surface-2]">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                        {modIdx + 1}
                      </span>
                      <h2 className="text-sm font-bold text-[--color-fg]">{mod.title}</h2>
                    </div>
                    {isEnrolled && lessons.length > 0 && (
                      <span className="text-xs font-medium text-[--color-fg-muted] shrink-0">
                        {modCompleted}/{lessons.length}
                      </span>
                    )}
                  </div>

                  {/* Lesson rows */}
                  <ul className="divide-y divide-[--color-border]">
                    {lessons.map((lesson, lesIdx) => {
                      const isDone = completedSet.has(lesson.id);
                      const isFirst = modIdx === 0 && lesIdx === 0;
                      const accessible = isEnrolled || isFirst;

                      return (
                        <li key={lesson.id}>
                          {accessible ? (
                            <Link
                              href={`/courses/${slug}/lessons/${lesson.id}`}
                              className="group flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-[--color-surface-2] active:bg-[--color-surface-2]"
                            >
                              {isDone ? (
                                <CheckCircle2
                                  className="size-4 shrink-0 text-[--color-brand]"
                                  strokeWidth={1.6}
                                  aria-hidden
                                />
                              ) : (
                                <PlayCircle
                                  className="size-4 shrink-0 text-[--color-fg-faint] group-hover:text-[--color-brand] transition-colors duration-150"
                                  strokeWidth={1.6}
                                  aria-hidden
                                />
                              )}
                              <span
                                className={[
                                  "flex-1 text-sm font-medium leading-snug",
                                  isDone
                                    ? "text-[--color-fg-muted] line-through decoration-[--color-fg-faint]"
                                    : "text-[--color-fg] group-hover:text-[--color-brand] transition-colors duration-150",
                                ].join(" ")}
                              >
                                {lesson.title}
                              </span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 px-5 py-3.5 opacity-40">
                              <Lock className="size-4 text-[--color-fg-faint] shrink-0" strokeWidth={1.6} />
                              <span className="text-sm font-medium text-[--color-fg-muted]">
                                {lesson.title}
                              </span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tags ── */}
        {course.tags?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {course.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border border-[--color-border] bg-[--color-surface] px-3 py-1 text-xs font-medium text-[--color-fg-muted]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
