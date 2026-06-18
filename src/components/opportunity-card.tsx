"use client";

import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import { Heart, ExternalLink, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CATEGORY_MAP } from "@/lib/categories";
import { MatchScoreBadge } from "@/components/match-score-badge";
import { toggleSave } from "@/server/opportunities/actions";
import type { OpportunityRow, CategoryRow, OpportunityType, Format } from "@/lib/supabase/types";
import { dur, ease } from "@/lib/motion/tokens";

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

// ── Deadline ──────────────────────────────────────────────────────────────────

interface DeadlineInfo {
  label: string;
  color: string;
}

function getDeadlineInfo(deadline: string | null): DeadlineInfo | null {
  if (!deadline) return null;
  const diffDays = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
  if (diffDays < 0) return { label: "Passed", color: "var(--color-fg-faint)" };
  if (diffDays === 0) return { label: "Due today", color: "var(--color-accent-red)" };
  if (diffDays <= 7) return { label: `${diffDays}d left`, color: "var(--color-accent-red)" };
  if (diffDays <= 30) return { label: `${diffDays}d left`, color: "var(--color-accent-orange)" };
  return {
    label: new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    color: "var(--color-success)",
  };
}

// ── Stagger animation ─────────────────────────────────────────────────────────

const cardVariant = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: dur.base, ease: ease.out, delay: Math.min(i * 0.045, 0.35) },
  }),
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface OpportunityCardProps {
  opportunity: OpportunityRow;
  category: CategoryRow | null;
  savedIds: string[];
  /** Position index for staggered entrance animation. */
  index?: number;
  matchScore?: number | null;
  reasons?: string[];
  caution?: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OpportunityCard({
  opportunity: opp,
  category,
  savedIds,
  index = 0,
  matchScore,
  reasons,
  caution,
}: OpportunityCardProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Local state — survives transitions without auto-reverting.
  // Synced to the server-authoritative prop after each router.refresh().
  const [saved, setSaved] = useState(() => savedIds.includes(opp.id));
  useEffect(() => {
    setSaved(savedIds.includes(opp.id));
  }, [savedIds, opp.id]);

  const catMeta = category ? CATEGORY_MAP[category.slug as keyof typeof CATEGORY_MAP] : null;
  const deadlineInfo = getDeadlineInfo(opp.deadline);
  const typeLabel = TYPE_LABELS[opp.type] ?? opp.type;

  function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next); // optimistic
    startTransition(async () => {
      const result = await toggleSave(opp.id);
      if (result.error) {
        setSaved(!next); // revert on error
        toast.error("Could not update saved state");
      } else {
        toast.success(result.saved ? "Saved!" : "Removed from saved");
        router.refresh(); // re-fetch server state so prop stays in sync
      }
    });
  }

  return (
    // `relative` is required for the stretched-link overlay
    <motion.article
      variants={cardVariant}
      initial="hidden"
      animate="show"
      custom={index}
      className="group relative flex flex-col rounded-2xl bg-[--color-surface] overflow-hidden cursor-pointer"
      style={{ boxShadow: "var(--shadow-card)" }}
      whileHover={{ y: -2, boxShadow: "var(--shadow-card-hover)", transition: { duration: 0.18, ease: "easeOut" } }}
    >
      {/*
       * Stretched link — covers the whole card, sits at z-0.
       * Interactive controls below are z-20 so they receive clicks normally.
       * aria-hidden because the title inside the card is the readable link text.
       */}
      <Link
        href={`/opportunities/${opp.slug}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-2 focus-visible:outline-brand"
        aria-label={opp.title}
        tabIndex={0}
      />

      <div className="relative z-0 flex flex-col gap-3 p-5 flex-1">
        {/* ── Top row: category chip + match badge ── */}
        <div className="flex items-start justify-between gap-2 min-h-[1.5rem]">
          {catMeta ? (
            <span
              className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-semibold shrink-0"
              style={{
                background: `${catMeta.chipInk}18`,
                color: catMeta.chipInk,
              }}
            >
              <catMeta.Icon size={10} strokeWidth={1.8} aria-hidden />
              {catMeta.name}
            </span>
          ) : (
            <span />
          )}
          {/* Badge sits above the stretched link so its tooltip works */}
          <span className="relative z-20">
            <MatchScoreBadge score={matchScore} reasons={reasons} caution={caution} />
          </span>
        </div>

        {/* ── Title (plain text — the stretched Link above is the nav target) ── */}
        <span className="font-extrabold text-[--color-fg] text-sm leading-snug line-clamp-2 group-hover:text-brand transition-colors duration-150">
          {opp.title}
        </span>

        {/* ── Type + Format ghost badges ── */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center h-5 px-2.5 rounded-full border border-[--color-border] text-[10px] font-medium text-[--color-fg-muted]">
            {typeLabel}
          </span>
          {opp.format && (
            <span className="inline-flex items-center h-5 px-2.5 rounded-full border border-[--color-border] text-[10px] font-medium text-[--color-fg-muted]">
              {FORMAT_LABELS[opp.format]}
            </span>
          )}
        </div>

        {/* ── Description ── */}
        <p className="text-[12px] text-[--color-fg-muted] line-clamp-3 leading-relaxed flex-1">
          {opp.description}
        </p>

        {/* ── Deadline + region ── */}
        <div className="flex flex-wrap items-center gap-3">
          {deadlineInfo && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: deadlineInfo.color }}
            >
              <Calendar size={11} strokeWidth={1.8} />
              {deadlineInfo.label}
            </span>
          )}
          {opp.region && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[--color-fg-faint]">
              <MapPin size={11} strokeWidth={1.8} />
              {opp.region}
            </span>
          )}
        </div>
      </div>

      {/* ── Footer: save + apply ── */}
      {/* z-20 puts these above the stretched link overlay */}
      <div className="relative z-20 flex items-center justify-between px-5 pb-5 pt-0 gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          aria-label={saved ? "Unsave" : "Save"}
          className={cn(
            "flex size-8 items-center justify-center rounded-full transition-all duration-200 active:scale-95",
            saved
              ? "bg-brand text-white"
              : "bg-[--color-canvas] text-[--color-fg-muted] hover:text-brand",
          )}
          style={
            saved
              ? { boxShadow: "0 4px 12px -2px rgba(22,163,74,0.4)" }
              : undefined
          }
        >
          <Heart
            size={14}
            strokeWidth={1.8}
            fill={saved ? "currentColor" : "none"}
          />
        </button>

        {opp.apply_url ? (
          <a
            href={opp.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full bg-brand text-white text-xs font-bold transition-all hover:bg-[--color-brand-strong] active:scale-95"
          >
            Apply
            <ExternalLink size={10} strokeWidth={2} />
          </a>
        ) : (
          <span className="inline-flex items-center h-8 px-4 rounded-full border border-[--color-border] text-xs font-semibold text-[--color-fg-muted]">
            View
          </span>
        )}
      </div>
    </motion.article>
  );
}
