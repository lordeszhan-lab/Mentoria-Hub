import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CourseCard } from "@/components/course-card";
import { getEnrolledCourseIds, getCourseProgress } from "@/server/courses/actions";
import { CATEGORIES } from "@/lib/categories";
import type { CourseRow, CategoryRow, CourseLevel, ModuleRow, LessonRow } from "@/lib/supabase/types";

// ── URL param helpers ─────────────────────────────────────────────────────────

type RawParams = { [key: string]: string | string[] | undefined };

function str(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

const LEVELS: { value: CourseLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const raw = await searchParams;
  const categoryFilter = str(raw.category);
  const levelFilter = str(raw.level) as CourseLevel | undefined;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // ── Fetch categories ────────────────────────────────────────────────────────

  const { data: categories } = (await db
    .from("categories")
    .select("*")) as { data: CategoryRow[] | null };

  const categoryById: Record<string, CategoryRow> = Object.fromEntries(
    (categories ?? []).map((c: CategoryRow) => [c.id, c]),
  );

  let categoryId: string | undefined;
  if (categoryFilter && categories) {
    const cat = categories.find((c: CategoryRow) => c.slug === categoryFilter);
    categoryId = cat?.id;
  }

  // ── Build course query ──────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = db.from("courses").select("*").eq("status", "published");
  if (categoryId) query = query.eq("category_id", categoryId);
  if (levelFilter) query = query.eq("level", levelFilter);

  const { data: courses } = (await query.order("created_at", { ascending: false })) as {
    data: CourseRow[] | null;
  };
  const courseList = courses ?? [];

  // ── Enrollment & progress ───────────────────────────────────────────────────

  const enrolledIds = await getEnrolledCourseIds(user.id);
  const enrolledSet = new Set(enrolledIds);
  const courseIds = courseList.map((c: CourseRow) => c.id);

  let lessonCountById: Record<string, number> = {};
  if (courseIds.length > 0) {
    const { data: modules } = (await db
      .from("modules")
      .select("id, course_id")
      .in("course_id", courseIds)) as { data: Pick<ModuleRow, "id" | "course_id">[] | null };

    if (modules?.length) {
      const moduleIds = modules.map((m: Pick<ModuleRow, "id" | "course_id">) => m.id);
      const { data: lessons } = (await db
        .from("lessons")
        .select("id, module_id")
        .in("module_id", moduleIds)) as { data: Pick<LessonRow, "id" | "module_id">[] | null };

      const moduleIdToCourseId: Record<string, string> = Object.fromEntries(
        modules.map((m: Pick<ModuleRow, "id" | "course_id">) => [m.id, m.course_id]),
      );
      for (const lesson of lessons ?? []) {
        const cid = moduleIdToCourseId[lesson.module_id];
        if (cid) lessonCountById[cid] = (lessonCountById[cid] ?? 0) + 1;
      }
    }
  }

  const progressByCourse: Record<string, number> = {};
  await Promise.all(
    enrolledIds
      .filter((id) => courseIds.includes(id))
      .map(async (courseId) => {
        const { progressPct } = await getCourseProgress(user.id, courseId);
        progressByCourse[courseId] = progressPct;
      }),
  );

  // ── Filter URL helpers ──────────────────────────────────────────────────────

  function filterUrl(overrides: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    const current: Record<string, string | undefined> = {
      category: categoryFilter,
      level: levelFilter,
    };
    const merged = { ...current, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return `/courses${qs ? `?${qs}` : ""}`;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[--color-canvas]">
      {/* ── Filter bar — white card, matching /opportunities ── */}
      <div className="relative z-10 border-b border-[--color-border] px-4 pt-4 pb-4">
        <div className="mx-auto max-w-7xl">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-extrabold tracking-tight text-[--color-fg]">Courses</h1>
            <span className="text-xs font-medium text-[--color-fg-faint]">
              {courseList.length === 0
                ? "No courses"
                : `${courseList.length} course${courseList.length === 1 ? "" : "s"}`}
            </span>
          </div>

          {/* Filter card */}
          <div
            className="rounded-2xl bg-[--color-surface] px-5 py-4 space-y-3"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            {/* Category chips — same style as /opportunities FilterBar */}
            <div className="flex flex-wrap gap-1.5">
              <FilterPill
                label="All"
                active={!categoryFilter}
                href={filterUrl({ category: undefined })}
              />
              {CATEGORIES.map((cat) => {
                const isActive = categoryFilter === cat.slug;
                return (
                  <FilterPill
                    key={cat.slug}
                    label={cat.name}
                    active={isActive}
                    href={filterUrl({ category: isActive ? undefined : cat.slug })}
                    icon={
                      <cat.Icon
                        size={12}
                        strokeWidth={1.6}
                        style={{ color: isActive ? "#fff" : cat.chipInk }}
                        aria-hidden
                      />
                    }
                  />
                );
              })}
            </div>

            {/* Level pills */}
            <div className="flex flex-wrap gap-1.5 pt-0.5 border-t border-[--color-border]">
              <span className="self-center text-[11px] font-medium text-[--color-fg-faint] mr-1">
                Level:
              </span>
              {LEVELS.map((lv) => (
                <FilterPill
                  key={lv.value}
                  label={lv.label}
                  active={levelFilter === lv.value}
                  href={filterUrl({
                    level: levelFilter === lv.value ? undefined : lv.value,
                  })}
                  small
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <main className="mx-auto max-w-7xl px-4 py-6 pb-16">
        {courseList.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courseList.map((course: CourseRow, idx: number) => (
              <CourseCard
                key={course.id}
                course={course}
                category={categoryById[course.category_id ?? ""] ?? null}
                index={idx}
                enrolled={enrolledSet.has(course.id)}
                progressPct={progressByCourse[course.id] ?? 0}
                totalLessons={lessonCountById[course.id] ?? 0}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ── FilterPill ────────────────────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  href,
  icon,
  small = false,
}: {
  label: string;
  active: boolean;
  href: string;
  icon?: React.ReactNode;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center gap-1.5 rounded-full font-semibold transition-all duration-200 select-none active:scale-[0.96]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand] focus-visible:ring-offset-1",
        small ? "h-7 px-3 text-[11px]" : "h-8 px-3.5 text-xs",
        active
          ? "bg-brand text-white"
          : "bg-[--color-surface] border border-[--color-border] text-[--color-fg-muted] hover:border-[--color-fg]/25 hover:text-[--color-fg] hover:shadow-sm",
      ].join(" ")}
      style={active ? { boxShadow: "0 4px 14px -2px rgba(22,163,74,0.35)" } : undefined}
    >
      {icon}
      {label}
    </Link>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div
        className="flex size-16 items-center justify-center rounded-2xl"
        style={{ background: "var(--color-brand-soft)" }}
      >
        <BookOpen className="size-7 text-[--color-brand]" strokeWidth={1.6} />
      </div>
      <div>
        <p className="text-lg font-extrabold text-[--color-fg]">No courses yet</p>
        <p className="mt-1 text-sm text-[--color-fg-muted]">
          Check back soon — we&apos;re adding courses regularly.
        </p>
      </div>
    </div>
  );
}
