import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, BookOpen, Star, Award, ArrowRight, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCourseProgress } from "@/server/courses/actions";
import { issueCertificate } from "@/server/courses/certificates";
import { CompleteCelebration } from "./complete-celebration";
import type { CourseRow, CategoryRow } from "@/lib/supabase/types";
import { CATEGORY_MAP } from "@/lib/categories";

export default async function CourseCompletePage({
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

  const { data: courseRaw } = (await db
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single()) as { data: CourseRow | null };

  if (!courseRaw) redirect("/courses");

  const course = courseRaw;

  // Verify enrollment.
  const { data: enrollment } = (await db
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .single()) as { data: { id: string } | null };

  if (!enrollment) redirect(`/courses/${slug}`);

  // Get progress.
  const { completedLessons, totalLessons, progressPct } = await getCourseProgress(
    user.id,
    course.id,
  );

  // Issue certificate if course is complete (idempotent — safe to call every time).
  const { certificate } = progressPct === 100
    ? await issueCertificate(course.id)
    : { certificate: undefined };

  // Category.
  const { data: category } = (await db
    .from("categories")
    .select("*")
    .eq("id", course.category_id ?? "")
    .single()) as { data: CategoryRow | null };

  const catMeta = category
    ? CATEGORY_MAP[category.slug as keyof typeof CATEGORY_MAP] ?? null
    : null;

  const accentColor = course.cover_color ?? (catMeta ? `var(${catMeta.accentToken})` : "var(--color-brand)");

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[--color-canvas] flex items-center justify-center px-4 py-16">
      {/* Fire confetti on mount */}
      <CompleteCelebration />

      <div className="mx-auto w-full max-w-md text-center">
        {/* Trophy icon */}
        <div
          className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full"
          style={{ background: `${accentColor}22` }}
        >
          <Trophy
            className="size-12"
            strokeWidth={1.4}
            style={{ color: accentColor }}
          />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-[--color-fg]">
          Course complete!
        </h1>
        <p className="mt-2 text-base text-[--color-fg-muted]">
          You finished{" "}
          <span className="font-bold text-[--color-fg]">{course.title}</span>
        </p>

        {/* Stats row */}
        <div className="mx-auto mt-6 grid max-w-xs grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-4 shadow-card">
            <div
              className="mx-auto mb-1 flex size-8 items-center justify-center rounded-xl"
              style={{ background: "var(--color-brand-soft)" }}
            >
              <BookOpen className="size-4 text-[--color-brand]" strokeWidth={1.6} />
            </div>
            <p className="text-lg font-extrabold tabular-nums text-[--color-fg]">
              {completedLessons}/{totalLessons}
            </p>
            <p className="text-[11px] font-medium text-[--color-fg-muted]">Lessons done</p>
          </div>
          <div className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-4 shadow-card">
            <div
              className="mx-auto mb-1 flex size-8 items-center justify-center rounded-xl"
              style={{ background: "#FFF6D6" }}
            >
              <Star className="size-4 text-[--color-accent-yellow]" strokeWidth={1.6} fill="currentColor" />
            </div>
            <p className="text-lg font-extrabold tabular-nums text-[--color-fg]">
              {completedLessons * 10}
            </p>
            <p className="text-[11px] font-medium text-[--color-fg-muted]">XP earned</p>
          </div>
        </div>

        {/* Certificate section */}
        {certificate ? (
          <div
            className="mt-6 rounded-2xl border p-5 text-left"
            style={{ borderColor: "#16A34A30", background: "#F0FDF4" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "#DCFCE7" }}
              >
                <Award size={18} style={{ color: "#16A34A" }} strokeWidth={1.6} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#15803D" }}>
                  Certificate earned!
                </p>
                <p className="text-xs" style={{ color: "#16A34A99" }}>
                  You can view and share your certificate of completion.
                </p>
              </div>
            </div>
            <Link
              href={`/certificates/${certificate.share_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99]"
              style={{ background: "#16A34A" }}
            >
              <Award size={15} strokeWidth={2} />
              View certificate
              <ExternalLink size={12} strokeWidth={2} />
            </Link>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-[--color-border] bg-[--color-surface-2] p-4 text-sm text-[--color-fg-muted]">
            <p className="text-xs text-[--color-fg-faint]">
              Complete all lessons to earn your certificate.{" "}
              {totalLessons > 0 && (
                <span>({completedLessons}/{totalLessons} done)</span>
              )}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/courses"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-bold text-white btn-ledge-brand transition-all"
            style={{ background: "var(--color-brand)" }}
          >
            Browse more courses
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
          <Link
            href={`/courses/${slug}`}
            className="inline-flex h-10 items-center justify-center rounded-full border border-[--color-border] bg-[--color-surface] text-sm font-semibold text-[--color-fg] hover:border-[--color-fg]/30 transition-colors"
          >
            Review course
          </Link>
        </div>
      </div>
    </main>
  );
}
