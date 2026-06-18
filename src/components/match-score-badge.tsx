"use client";

/**
 * MatchScoreBadge — shows a 0–100 semantic match score as a ring badge.
 * - score null/undefined → renders nothing (no badge shown)
 * - reasons provided → tooltip on hover listing why the opportunity fits
 */

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MatchScoreBadgeProps {
  score?: number | null;
  reasons?: string[];
  caution?: string | null;
}

export function MatchScoreBadge({ score, reasons, caution }: MatchScoreBadgeProps) {
  if (score == null) return null;

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const color =
    clamped >= 75 ? "#16A34A" : clamped >= 50 ? "#FF9600" : "#6B7280";

  const badge = (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold leading-none select-none cursor-default"
      style={{
        color,
        background: `${color}14`,
        boxShadow: `0 0 0 1.5px ${color}40`,
      }}
      aria-label={`${clamped}% match`}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} aria-hidden />
      {clamped}%
    </span>
  );

  if (!reasons?.length) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={badge} />
        <TooltipContent
          side="bottom"
          align="end"
          className="max-w-56 rounded-xl px-3 py-2.5 text-left"
        >
          <p className="text-[11px] font-semibold mb-1.5 text-white/80 uppercase tracking-wide">
            Why it fits
          </p>
          <ul className="space-y-1">
            {reasons.map((r, i) => (
              <li key={i} className="text-xs leading-snug flex gap-1.5">
                <span className="mt-0.5 shrink-0 size-1 rounded-full bg-white/50" aria-hidden />
                {r}
              </li>
            ))}
          </ul>
          {caution && (
            <p className="mt-2 text-[11px] text-amber-200 leading-snug">
              Note: {caution}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
