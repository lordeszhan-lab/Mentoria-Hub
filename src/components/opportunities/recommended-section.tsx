/**
 * RecommendedSection — server component that renders personalised top picks.
 * Loaded inside a Suspense boundary so it never blocks the base catalog.
 *
 * coldStart / null scores is a valid success state: render cards without badges.
 */
import { createClient } from "@/lib/supabase/server";
import { getRecommendations } from "@/server/reco/getRecommendations";
import { OpportunityCard } from "@/components/opportunity-card";
import type { CategoryRow } from "@/lib/supabase/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export async function RecommendedSection() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as AnySupabase;

  let recoResult;
  try {
    recoResult = await getRecommendations(user.id);
  } catch (err) {
    console.error("[reco:ui] RecommendedSection — getRecommendations threw:", err);
    return null;
  }

  const { items, coldStart, pipelineNote } = recoResult;

  console.log("[reco:ui] RecommendedSection resolved", {
    itemCount: items.length,
    coldStart,
    pipelineNote: pipelineNote ?? null,
  });

  if (pipelineNote) {
    console.warn("[reco:ui] pipeline degraded:", pipelineNote);
  }

  // Nothing to show
  if (items.length === 0) return null;

  const [{ data: categories }, { data: savedRows }] = await Promise.all([
    db.from("categories").select("*") as Promise<{ data: CategoryRow[] | null }>,
    db.from("saved_opportunities").select("opportunity_id").eq("user_id", user.id) as Promise<{
      data: Array<{ opportunity_id: string }> | null;
    }>,
  ]);

  const categoryById: Record<string, CategoryRow> = Object.fromEntries(
    (categories ?? []).map((c: CategoryRow) => [c.id, c]),
  );
  const savedIds = (savedRows ?? []).map((r) => r.opportunity_id);

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-extrabold text-[--color-fg] tracking-tight">
          Recommended for you
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, idx) => (
          <OpportunityCard
            key={item.opportunity.id}
            opportunity={item.opportunity}
            category={categoryById[item.opportunity.category_id ?? ""] ?? null}
            savedIds={savedIds}
            index={idx}
            matchScore={item.matchScore}
            reasons={item.reasons}
            caution={item.caution}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-[--color-border]" />
        <span className="text-xs text-[--color-fg-faint] font-medium shrink-0">
          All opportunities
        </span>
        <div className="flex-1 h-px bg-[--color-border]" />
      </div>
    </section>
  );
}
