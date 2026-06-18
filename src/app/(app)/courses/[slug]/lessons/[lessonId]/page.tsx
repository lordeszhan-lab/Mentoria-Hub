import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ExternalLink,
  PlayCircle,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PortableContent } from "@/components/portable-content";
import { LessonClient } from "./lesson-client";
import type {
  LessonRow,
  ModuleRow,
  CourseRow,
  QuizRow,
  LessonProgressRow,
} from "@/lib/supabase/types";
import type { QuizQuestion } from "@/server/courses/actions";

// ── Helpers ───────────────────────────────────────────────────────────────────

interface Material {
  label: string;
  url: string;
}

/** Returns true only when content is a non-empty array or a non-empty string. */
function hasContent(content: unknown): boolean {
  if (!content) return false;
  if (Array.isArray(content)) return content.length > 0;
  if (typeof content === "string") return content.trim().length > 0;
  return false;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // ── Lesson ────────────────────────────────────────────────────────────────

  const { data: lessonRaw } = (await db
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single()) as { data: LessonRow | null };

  if (!lessonRaw) notFound();
  const lesson = lessonRaw;

  // ── Module ────────────────────────────────────────────────────────────────

  const { data: mod } = (await db
    .from("modules")
    .select("*")
    .eq("id", lesson.module_id)
    .single()) as { data: ModuleRow | null };

  if (!mod) notFound();

  // ── Course ────────────────────────────────────────────────────────────────

  const { data: courseRaw } = (await db
    .from("courses")
    .select("*")
    .eq("id", mod.course_id)
    .eq("slug", slug)
    .single()) as { data: CourseRow | null };

  if (!courseRaw) notFound();
  const course = courseRaw;

  // Verify enrollment.
  const { data: enrollment } = (await db
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .single()) as { data: { id: string } | null };

  if (!enrollment) redirect(`/courses/${slug}`);

  // ── All lessons (for prev/next) ───────────────────────────────────────────

  const { data: allModules } = (await db
    .from("modules")
    .select("id, order_index")
    .eq("course_id", course.id)
    .order("order_index", { ascending: true })) as {
    data: Pick<ModuleRow, "id" | "order_index">[] | null;
  };

  const moduleIds = (allModules ?? []).map((m: Pick<ModuleRow, "id" | "order_index">) => m.id);
  const moduleOrder = Object.fromEntries(
    (allModules ?? []).map((m: Pick<ModuleRow, "id" | "order_index">, i: number) => [m.id, i]),
  );

  const { data: allLessonsRaw } = (await db
    .from("lessons")
    .select("id, module_id, order_index, title")
    .in("module_id", moduleIds.length ? moduleIds : ["__none__"])
    .order("order_index", { ascending: true })) as {
    data: Pick<LessonRow, "id" | "module_id" | "order_index" | "title">[] | null;
  };

  const allLessons = [...(allLessonsRaw ?? [])].sort((a, b) => {
    const mDiff = (moduleOrder[a.module_id] ?? 0) - (moduleOrder[b.module_id] ?? 0);
    if (mDiff !== 0) return mDiff;
    return a.order_index - b.order_index;
  });

  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;
  const isLastLesson = currentIdx === allLessons.length - 1;

  // ── Quiz ──────────────────────────────────────────────────────────────────

  const { data: quizRaw } = (await db
    .from("quizzes")
    .select("*")
    .eq("lesson_id", lessonId)
    .single()) as { data: QuizRow | null };

  const quiz = quizRaw;
  const questions: QuizQuestion[] = Array.isArray(quiz?.questions)
    ? (quiz!.questions as unknown as QuizQuestion[])
    : [];

  // ── Lesson progress ───────────────────────────────────────────────────────

  const { data: progressRaw } = (await db
    .from("lesson_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .single()) as { data: LessonProgressRow | null };

  const isCompleted = progressRaw?.status === "completed";
  const quizScore = progressRaw?.quiz_score ?? null;
  const quizPassed = quizScore !== null && quizScore >= 70;

  // Materials.
  const materials: Material[] = Array.isArray(lesson.materials)
    ? (lesson.materials as unknown as Material[]).filter(
        (m): m is Material =>
          typeof m === "object" && m !== null && "url" in m && "label" in m,
      )
    : [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[--color-canvas]">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 lg:px-8">

        {/* ── Breadcrumb ── */}
        <nav className="mb-5 flex items-center gap-1.5 text-xs text-[--color-fg-muted]" aria-label="Breadcrumb">
          <Link href="/courses" className="hover:text-[--color-brand] transition-colors duration-150">
            Courses
          </Link>
          <span className="text-[--color-fg-faint]">/</span>
          <Link
            href={`/courses/${slug}`}
            className="hover:text-[--color-brand] transition-colors duration-150 max-w-[180px] truncate"
          >
            {course.title}
          </Link>
          <span className="text-[--color-fg-faint]">/</span>
          <span className="text-[--color-fg-faint] truncate max-w-[160px]">{lesson.title}</span>
        </nav>

        {/* ── Lesson header — onboarding StepHeader pattern ── */}
        <div className="mb-6 flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft mt-0.5">
            <BookOpen size={18} strokeWidth={1.6} className="text-brand" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[--color-fg-faint] mb-1">
              {mod.title}
            </p>
            <h1 className="text-xl font-extrabold tracking-tight text-[--color-fg] leading-tight">
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* ── Video area ── */}
        {lesson.video_url ? (
          <div className="mb-6 overflow-hidden rounded-2xl bg-black shadow-card aspect-video">
            <iframe
              src={lesson.video_url}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`Video: ${lesson.title}`}
            />
          </div>
        ) : (
          <div
            className="mb-6 flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-[--color-border] bg-[--color-surface-2] py-10 text-center"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-[--color-surface]">
              <PlayCircle className="size-5 text-[--color-fg-faint]" strokeWidth={1.4} />
            </div>
            <p className="text-sm font-medium text-[--color-fg-muted]">Video coming soon</p>
          </div>
        )}

        {/* ── Lesson content (only render when non-empty) ── */}
        {hasContent(lesson.content) && (
          <div
            className="mb-8 rounded-2xl bg-[--color-surface] p-6 shadow-card"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <PortableContent content={lesson.content} />
          </div>
        )}

        {/* ── Materials ── */}
        {materials.length > 0 && (
          <div
            className="mb-8 rounded-2xl bg-[--color-surface] p-5 shadow-card"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <div className="mb-3 flex items-center gap-2">
              <FileText className="size-4 text-[--color-fg-muted]" strokeWidth={1.6} />
              <h2 className="text-sm font-bold text-[--color-fg]">Materials</h2>
            </div>
            <ul className="space-y-2">
              {materials.map((mat, i) => (
                <li key={i}>
                  <a
                    href={mat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[--color-brand] hover:underline transition-colors"
                  >
                    <ExternalLink className="size-3.5" strokeWidth={1.8} />
                    {mat.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Client interactive layer (quiz + mark complete + confetti) ── */}
        <LessonClient
          lessonId={lessonId}
          courseSlug={slug}
          questions={questions}
          hasQuiz={!!quiz}
          initialCompleted={isCompleted}
          initialQuizPassed={quizPassed}
          isLastLesson={isLastLesson}
          nextLessonId={nextLesson?.id ?? null}
        />

        {/* ── Prev / Next navigation ── */}
        <div className="mt-8 flex items-center justify-between gap-4">
          {prevLesson ? (
            <Link
              href={`/courses/${slug}/lessons/${prevLesson.id}`}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[--color-border] bg-[--color-surface] text-sm font-semibold text-[--color-fg] hover:bg-[--color-surface-2] hover:border-[--color-fg]/25 active:scale-[0.99] transition-all duration-150"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              <span className="hidden sm:inline max-w-[160px] truncate">{prevLesson.title}</span>
              <span className="sm:hidden">Prev</span>
            </Link>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <Link
              href={`/courses/${slug}/lessons/${nextLesson.id}`}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[--color-border] bg-[--color-surface] text-sm font-semibold text-[--color-fg] hover:bg-[--color-surface-2] hover:border-[--color-fg]/25 active:scale-[0.99] transition-all duration-150"
            >
              <span className="hidden sm:inline max-w-[160px] truncate">{nextLesson.title}</span>
              <span className="sm:hidden">Next</span>
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </main>
  );
}
