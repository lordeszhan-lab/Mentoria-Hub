import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSavedIds } from "@/server/opportunities/actions";
import { FilterBar } from "@/components/opportunities/filter-bar";
import { OpportunityCard } from "@/components/opportunity-card";
import { RecommendedSectionWithFallback } from "@/components/opportunities/recommended-section-boundary";
import { RecommendedSection } from "@/components/opportunities/recommended-section";
import type {
  OpportunityType,
  Format,
  CategoryRow,
  OpportunityRow,
} from "@/lib/supabase/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ── URL param contract ────────────────────────────────────────────────────────
//
//  ?q=<keyword>          Full-text search (websearch syntax) on search_vector
//  ?category=<slug>      Category slug (e.g. "business", "stem")
//  ?type=<enum>          OpportunityType enum value
//  ?format=<enum>        Format enum value (online|offline|hybrid)
//  ?grade=<8-11>         Grade — matches where min_grade<=g<=max_grade or null
//  ?deadline=7d|30d|season   Deadline window relative to now
//  ?page=<n>             1-based page number (default 1)

type RawParams = { [key: string]: string | string[] | undefined };

function str(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const t = await getTranslations("catalog");
  const raw = await searchParams;

  const q = str(raw.q);
  const category = str(raw.category);
  const type = str(raw.type) as OpportunityType | undefined;
  const format = str(raw.format) as Format | undefined;
  const grade = str(raw.grade);
  const deadline = str(raw.deadline) as "7d" | "30d" | "season" | undefined;
  const page = Math.max(1, parseInt(str(raw.page) ?? "1", 10));

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // ── Fetch support data ────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [{ data: categories }, savedIds] = await Promise.all([
    db.from("categories").select("*") as Promise<{ data: CategoryRow[] | null }>,
    getSavedIds(user.id),
  ]);

  // Resolve category slug → id
  let categoryId: string | undefined;
  if (category && categories) {
    const cat = categories.find((c) => c.slug === category);
    categoryId = cat?.id;
  }

  // ── Build query ───────────────────────────────────────────────────────────

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = db
    .from("opportunities")
    .select("*", { count: "exact" })
    .eq("status", "published");

  if (q) {
    query = query.textSearch("search_vector", q, {
      type: "websearch",
      config: "english",
    });
  }
  if (categoryId) query = query.eq("category_id", categoryId);
  if (type) query = query.eq("type", type);
  if (format) query = query.eq("format", format);

  if (grade) {
    const g = parseInt(grade, 10);
    if (!isNaN(g)) {
      query = query
        .or(`min_grade.is.null,min_grade.lte.${g}`)
        .or(`max_grade.is.null,max_grade.gte.${g}`);
    }
  }

  const now = new Date();
  if (deadline === "7d") {
    const d = new Date(now.getTime() + 7 * 86_400_000).toISOString();
    query = query
      .not("deadline", "is", null)
      .gte("deadline", now.toISOString())
      .lte("deadline", d);
  } else if (deadline === "30d") {
    const d = new Date(now.getTime() + 30 * 86_400_000).toISOString();
    query = query
      .not("deadline", "is", null)
      .gte("deadline", now.toISOString())
      .lte("deadline", d);
  } else if (deadline === "season") {
    const d = new Date(now.getTime() + 90 * 86_400_000).toISOString();
    query = query
      .not("deadline", "is", null)
      .gte("deadline", now.toISOString())
      .lte("deadline", d);
  }

  const {
    data: opportunities,
    count,
    error,
  } = await query
    .order("deadline", { ascending: true, nullsFirst: false })
    .range(from, to);

  if (error) {
    console.error("[OpportunitiesPage] query error:", error);
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Category lookup map ───────────────────────────────────────────────────

  const categoryById: Record<string, CategoryRow> = Object.fromEntries(
    (categories ?? []).map((c) => [c.id, c]),
  );

  const activeFilters = { q, category, type, format, grade, deadline };
  const hasFilters = !!(q || category || type || format || grade || deadline);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[--color-canvas]">
      {/*
       * Filter bar — scrolls with the page (not sticky).
       * `relative z-10` creates a stacking context at z:10 so that
       * absolute-positioned dropdown menus inside the filter bar paint
       * ABOVE the card grid below (which has `isolate` / z:auto).
       * Without this, the card grid's `isolate` stacking context wins by
       * DOM order and the dropdowns render behind the cards.
       */}
      <div className="relative z-10 border-b border-[--color-border] px-4 pt-4 pb-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-extrabold text-[--color-fg] tracking-tight">
              {t("title")}
            </h1>
            <span className="text-xs text-[--color-fg-faint] font-medium">
              {total === 0 ? t("noResults") : t("count", { count: total })}
            </span>
          </div>
          <FilterBar
            categories={categories ?? []}
            activeFilters={activeFilters}
          />
        </div>
      </div>

      {/*
       * `isolate` scopes all child z-indices so animated cards never paint
       * above the sticky app header which lives outside this context.
       */}
      <div className="isolate">
        {/* Recommended section — only when no active filters are applied */}
        {!hasFilters && (
          <RecommendedSectionWithFallback>
            <RecommendedSection />
          </RecommendedSectionWithFallback>
        )}

        {/* Main content */}
        <main className="mx-auto max-w-7xl px-4 py-6 pb-16">
          {!opportunities?.length ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {((opportunities ?? []) as OpportunityRow[]).map((opp, idx) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    category={categoryById[opp.category_id ?? ""] ?? null}
                    savedIds={savedIds}
                    index={idx}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  activeFilters={activeFilters}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

async function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  const t = await getTranslations("catalog");
  const tCommon = await getTranslations("common");
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div
        className="flex size-20 items-center justify-center rounded-2xl text-4xl"
        style={{ background: "#FFF6D6" }}
      >
        🔭
      </div>
      <div>
        <p className="text-lg font-extrabold text-[--color-fg]">
          {t("noResults")}
        </p>
      </div>
      {hasFilters && (
        <Link
          href="/opportunities"
          className="inline-flex items-center h-9 px-5 rounded-full bg-brand text-white text-sm font-bold hover:bg-[--color-brand-strong] transition-colors active:scale-95"
        >
          {tCommon("clearAll")}
        </Link>
      )}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  activeFilters,
}: {
  page: number;
  totalPages: number;
  activeFilters: Record<string, string | undefined>;
}) {
  function pageUrl(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(activeFilters)) {
      if (v) params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/opportunities${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      {page > 1 && (
        <Link
          href={pageUrl(page - 1)}
          className="inline-flex items-center h-9 px-4 rounded-xl bg-[--color-surface] border border-[--color-border] text-sm font-semibold text-[--color-fg] hover:border-[--color-fg]/30 transition-colors"
        >
          ← Previous
        </Link>
      )}
      <span className="text-sm text-[--color-fg-muted]">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link
          href={pageUrl(page + 1)}
          className="inline-flex items-center h-9 px-4 rounded-xl bg-[--color-surface] border border-[--color-border] text-sm font-semibold text-[--color-fg] hover:border-[--color-fg]/30 transition-colors"
        >
          Next →
        </Link>
      )}
    </div>
  );
}
