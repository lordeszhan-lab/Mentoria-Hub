import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { listCourses } from "@/server/admin/courses";
import { archiveCourse, deleteCourse } from "@/server/admin/courses";
import type { ContentStatus, CourseRow } from "@/lib/supabase/types";
import { CoursesTableActions } from "./table-actions";

type RawParams = { [key: string]: string | string[] | undefined };

function str(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

// ── Status badge ───────────────────────────────────────────────────────────────

async function StatusBadge({ status }: { status: ContentStatus }) {
  const t = await getTranslations("admin");
  if (status === "published") {
    return (
      <span className="inline-flex items-center h-5 px-2.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
        {t("published")}
      </span>
    );
  }
  if (status === "archived") {
    return (
      <span className="inline-flex items-center h-5 px-2.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
        {t("archived")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center h-5 px-2.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
      {t("draft")}
    </span>
  );
}

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const raw = await searchParams;
  const q = str(raw.q);
  const status = str(raw.status);
  const page = Math.max(1, parseInt(str(raw.page) ?? "1", 10));

  const [{ rows, count }, t, tCommon, tCourses] = await Promise.all([
    listCourses({ q, status, page }),
    getTranslations("admin"),
    getTranslations("common"),
    getTranslations("courses"),
  ]);
  const totalPages = Math.ceil(count / 30);

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{t("courses")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{count} total</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground
            text-sm font-semibold shadow-sm hover:bg-primary/90 active:scale-[0.99]
            transition-all duration-200 motion-reduce:transition-none"
        >
          <Plus size={14} strokeWidth={2.5} aria-hidden />
          {t("new")}
        </Link>
      </div>

      {/* Filters */}
      <form method="get" className="flex items-center gap-2.5 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            size={14}
            strokeWidth={1.6}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder={tCommon("search")}
            className="w-full h-9 pl-9 pr-3.5 rounded-full border border-border bg-card text-sm
              text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40
              shadow-sm transition-all duration-200"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-9 px-3 rounded-full border border-border bg-card text-sm text-foreground
            focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40
            shadow-sm transition-all duration-200 cursor-pointer"
        >
          <option value="">{t("status")}</option>
          <option value="draft">{t("draft")}</option>
          <option value="published">{t("published")}</option>
          <option value="archived">{t("archived")}</option>
        </select>
        <button
          type="submit"
          className="h-9 px-4 rounded-full border border-border bg-card text-sm font-medium
            text-muted-foreground hover:bg-muted hover:text-foreground shadow-sm
            transition-colors duration-200 motion-reduce:transition-none"
        >
          {tCommon("filter")}
        </button>
        {(q || status) && (
          <Link
            href="/admin/courses"
            className="h-9 px-4 rounded-full border border-border bg-card text-sm font-medium
              text-muted-foreground hover:bg-muted hover:text-foreground shadow-sm
              transition-colors duration-200 flex items-center"
          >
            {tCommon("clearAll")}
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {t("courses")}{" "}
            <Link href="/admin/courses/new" className="text-primary font-semibold hover:underline">
              {t("new")}
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("title_")}</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{tCourses("level")}</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("status")}</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Est. min</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {rows.map((course) => (
                <tr
                  key={course.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors duration-150"
                >
                  <td className="px-4 py-3.5">
                    <span className="font-medium text-foreground line-clamp-1">{course.title}</span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {tCourses(course.level as "beginner" | "intermediate" | "advanced")}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={course.status} />
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground tabular-nums text-xs">
                    {course.estimated_minutes ? `${course.estimated_minutes} min` : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <CoursesTableActions
                      id={course.id}
                      archive={archiveCourse}
                      del={deleteCourse}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/courses?page=${page - 1}${q ? `&q=${q}` : ""}${status ? `&status=${status}` : ""}`}
              className="h-8 px-4 rounded-full border border-border bg-card text-sm font-medium
                text-muted-foreground hover:bg-muted hover:text-foreground
                flex items-center transition-colors duration-200"
            >
              ← Prev
            </Link>
          )}
          <span className="text-sm text-muted-foreground tabular-nums px-2">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/courses?page=${page + 1}${q ? `&q=${q}` : ""}${status ? `&status=${status}` : ""}`}
              className="h-8 px-4 rounded-full border border-border bg-card text-sm font-medium
                text-muted-foreground hover:bg-muted hover:text-foreground
                flex items-center transition-colors duration-200"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
