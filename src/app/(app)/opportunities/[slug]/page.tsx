import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
  Calendar,
  MapPin,
  ExternalLink,
  GraduationCap,
  Globe,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSavedIds } from "@/server/opportunities/actions";
import { CATEGORY_MAP } from "@/lib/categories";
import type { OpportunityType, Format, CategoryRow, OpportunityRow } from "@/lib/supabase/types";
import { SaveButton } from "./save-button";
import { MatchReasonsSection } from "./match-reasons";
import { AiWorkingLoader } from "@/components/ai-working-loader";

// ── Labels ────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<OpportunityType, string> = {
  olympiad: "Olympiad",
  competition: "Competition",
  hackathon: "Hackathon",
  scholarship: "Scholarship",
  internship: "Internship",
  research: "Research",
  summer_school: "Summer School",
  volunteering: "Volunteering",
  other: "Other",
};

const FORMAT_LABELS: Record<Format, string> = {
  online: "Online",
  offline: "In-person",
  hybrid: "Hybrid",
};

// ── Deadline helper ───────────────────────────────────────────────────────────

function formatDeadline(deadline: string | null) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const diffDays = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  const formatted = d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  if (diffDays < 0) return { formatted, urgency: "passed", diffDays };
  if (diffDays <= 7) return { formatted, urgency: "red", diffDays };
  if (diffDays <= 30) return { formatted, urgency: "orange", diffDays };
  return { formatted, urgency: "green", diffDays };
}

const urgencyColor: Record<string, string> = {
  passed: "var(--color-fg-faint)",
  red: "var(--color-accent-red)",
  orange: "var(--color-accent-orange)",
  green: "var(--color-success)",
};

// ── Section heading eyebrow ───────────────────────────────────────────────────

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[--color-fg-faint] mb-2">
      {children}
    </p>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Fetch opportunity
  const { data: oppRaw } = (await db
    .from("opportunities")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single()) as { data: OpportunityRow | null };

  const opp = oppRaw;
  if (!opp) notFound();

  // Fetch category + saved state
  const [{ data: category }, savedIds] = await Promise.all([
    opp.category_id
      ? (db.from("categories").select("*").eq("id", opp.category_id).single() as Promise<{
          data: CategoryRow | null;
        }>)
      : Promise.resolve({ data: null }),
    getSavedIds(user.id),
  ]);

  const catMeta = category
    ? CATEGORY_MAP[category.slug as keyof typeof CATEGORY_MAP]
    : null;
  const deadlineInfo = formatDeadline(opp.deadline);
  const isSaved = savedIds.includes(opp.id);

  const gradeRange =
    opp.min_grade != null || opp.max_grade != null
      ? opp.min_grade === opp.max_grade
        ? `Grade ${opp.min_grade}`
        : `Grade ${opp.min_grade ?? "any"}–${opp.max_grade ?? "any"}`
      : null;

  return (
    <div className="min-h-screen bg-[--color-canvas]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[--color-fg-muted] hover:text-[--color-fg] mb-6 transition-colors"
        >
          <ArrowLeft size={13} />
          Back to catalog
        </Link>

        {/*
         * Main card — fade + rise entrance via CSS animation.
         * No accent color stripe; clean white surface.
         */}
        <div
          className="rounded-2xl bg-[--color-surface] border border-[--color-border] animate-in fade-in slide-in-from-bottom-3 duration-300"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="p-6 md:p-8">

            {/* ── Header block ── */}
            <div className="mb-5">
              {/* Category chip + type/format badges */}
              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                {catMeta && (
                  <span
                    className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-semibold"
                    style={{
                      background: `${catMeta.chipInk}12`,
                      color: catMeta.chipInk,
                    }}
                  >
                    <catMeta.Icon size={10} strokeWidth={1.8} aria-hidden />
                    {catMeta.name}
                  </span>
                )}
                <span className="inline-flex items-center h-5 px-2.5 rounded-full border border-[--color-border] text-[10px] font-medium text-[--color-fg-faint]">
                  {TYPE_LABELS[opp.type] ?? opp.type}
                </span>
                {opp.format && (
                  <span className="inline-flex items-center h-5 px-2.5 rounded-full border border-[--color-border] text-[10px] font-medium text-[--color-fg-faint]">
                    {FORMAT_LABELS[opp.format]}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-[22px] font-extrabold text-[--color-fg] leading-tight tracking-tight mb-3">
                {opp.title}
              </h1>

              {/* Meta strip */}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {deadlineInfo && (
                  <div
                    className="flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: urgencyColor[deadlineInfo.urgency] }}
                  >
                    <Calendar size={13} />
                    <span>{deadlineInfo.formatted}</span>
                    {deadlineInfo.urgency !== "passed" && (
                      <span className="text-[11px] opacity-60 font-medium">
                        ({deadlineInfo.diffDays}d)
                      </span>
                    )}
                  </div>
                )}
                {opp.region && (
                  <div className="flex items-center gap-1.5 text-sm text-[--color-fg-muted]">
                    <MapPin size={13} />
                    <span>{opp.region}</span>
                  </div>
                )}
                {gradeRange && (
                  <div className="flex items-center gap-1.5 text-sm text-[--color-fg-muted]">
                    <GraduationCap size={13} />
                    <span>{gradeRange}</span>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-[--color-border] mb-6" />

            {/* ── About ── */}
            <section className="mb-6">
              <SectionEyebrow>About</SectionEyebrow>
              <p className="text-sm text-[--color-fg-muted] leading-relaxed whitespace-pre-wrap">
                {opp.description}
              </p>
            </section>

            {/* ── Requirements ── */}
            {opp.requirements && (
              <section className="mb-6">
                <SectionEyebrow>Requirements &amp; Eligibility</SectionEyebrow>
                <p className="text-sm text-[--color-fg-muted] leading-relaxed whitespace-pre-wrap">
                  {opp.requirements}
                </p>
              </section>
            )}

            {/* ── Why this could fit you ── */}
            <Suspense
              fallback={
                <section
                  className="mb-6 rounded-xl px-4 py-4"
                  style={{ background: "var(--color-brand-soft)" }}
                >
                  <p className="text-sm font-extrabold text-brand mb-3">
                    Why this could fit you
                  </p>
                  <AiWorkingLoader variant="block" />
                </section>
              }
            >
              <MatchReasonsSection opportunity={opp} />
            </Suspense>

            {/* ── Deadline ── */}
            {opp.deadline && (
              <section className="mb-6">
                <SectionEyebrow>Deadline</SectionEyebrow>
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: deadlineInfo ? urgencyColor[deadlineInfo.urgency] : undefined,
                    }}
                  >
                    {deadlineInfo?.formatted}
                  </span>
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full border border-[--color-border] text-xs font-semibold text-[--color-fg-faint] cursor-not-allowed opacity-60"
                    title="Calendar integration coming soon"
                  >
                    <Calendar size={11} />
                    Add to calendar
                    {/* TODO(prompt-18): wire .ics download */}
                  </button>
                </div>
              </section>
            )}

            {/* ── Source provenance ── */}
            {opp.source && (
              <p className="text-[11px] text-[--color-fg-faint] mb-6">
                Source: <span className="font-semibold">{opp.source}</span>
              </p>
            )}

            <hr className="border-[--color-border] mb-6" />

            {/* ── CTA row ── */}
            <div className="flex items-center gap-3">
              <SaveButton opportunityId={opp.id} initialSaved={isSaved} />

              {opp.apply_url && (
                <a
                  href={opp.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-brand text-white font-bold text-sm hover:bg-[--color-brand-strong] transition-colors active:scale-95"
                >
                  Apply now
                  <ExternalLink size={13} />
                </a>
              )}

              {opp.source_raw && (
                <a
                  href={opp.source_raw}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[--color-fg-faint] hover:text-[--color-fg-muted] transition-colors"
                >
                  <Globe size={13} />
                  Source
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
