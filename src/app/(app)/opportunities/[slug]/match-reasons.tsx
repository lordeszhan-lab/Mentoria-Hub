/**
 * MatchReasonsSection — server component that computes personalised match
 * reasons for a specific opportunity and renders the "Why this could fit you"
 * card on the detail page.
 *
 * For opportunities in the user's top-6 recommendations the cached result is
 * used (fast). For any other opportunity an on-demand single-item LLM call is
 * made so the user always sees a real score + reasons, never a misleading
 * "complete your profile" message.
 */
import { createClient } from "@/lib/supabase/server";
import { scoreForDetailPage } from "@/server/reco/getRecommendations";
import type { OpportunityRow } from "@/lib/supabase/types";

interface Props {
  opportunity: OpportunityRow;
}

export async function MatchReasonsSection({ opportunity }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let scored = null as Awaited<ReturnType<typeof scoreForDetailPage>>["scored"];
  let noProfileVector = false;
  let scoringFailed = false;

  try {
    const result = await scoreForDetailPage(user.id, opportunity);
    scored = result.scored;
    noProfileVector = result.noProfileVector;
    scoringFailed = result.scoringFailed;
  } catch {
    scoringFailed = true;
  }

  // ── No profile vector: user genuinely hasn't completed onboarding ──────────
  if (noProfileVector) {
    return (
      <section className="mb-6 rounded-xl bg-[--color-brand-soft] px-4 py-3 animate-in fade-in duration-500">
        <h2 className="text-sm font-extrabold text-brand mb-1">
          Why this could fit you
        </h2>
        <p className="text-xs text-[--color-fg-muted] italic">
          Complete your profile to see personalised match insights.
        </p>
      </section>
    );
  }

  // ── Scoring failed (profile is fine, pipeline errored) ────────────────────
  if (scoringFailed || scored == null) {
    return (
      <section className="mb-6 rounded-xl bg-[--color-brand-soft] px-4 py-3 animate-in fade-in duration-500">
        <h2 className="text-sm font-extrabold text-brand mb-1">
          Why this could fit you
        </h2>
        <p className="text-xs text-[--color-fg-muted] italic">
          Match insights are unavailable right now.
        </p>
      </section>
    );
  }

  const { matchScore, reasons, caution } = scored;

  const color =
    matchScore != null
      ? matchScore >= 75
        ? "#16A34A"
        : matchScore >= 50
          ? "#FF9600"
          : "#6B7280"
      : "#6B7280";

  return (
    <section className="mb-6 rounded-xl bg-[--color-brand-soft] px-4 py-3.5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-extrabold text-brand">
          Why this could fit you
        </h2>
        {matchScore != null && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold leading-none select-none"
            style={{
              color,
              background: `${color}14`,
              boxShadow: `0 0 0 1.5px ${color}40`,
            }}
          >
            <span className="size-1.5 rounded-full" style={{ background: color }} aria-hidden />
            {matchScore}% match
          </span>
        )}
      </div>

      {reasons.length > 0 ? (
        <ul className="space-y-1.5">
          {reasons.map((reason, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-[--color-fg-muted] leading-snug"
            >
              <span
                className="mt-1 shrink-0 size-1.5 rounded-full"
                style={{ background: color }}
                aria-hidden
              />
              {reason}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[--color-fg-muted] italic">
          This opportunity appears in your recommendations.
        </p>
      )}

      {caution && (
        <p className="mt-2 text-[11px] text-amber-600 leading-snug font-medium">
          Note: {caution}
        </p>
      )}
    </section>
  );
}
