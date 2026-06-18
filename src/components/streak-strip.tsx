"use client";

/**
 * StreakStrip — 7-day weekday flame row (§5.9, Edupro reference).
 *
 * Design intent:
 *   - Visible TRACK PROGRESS is the hero; streak is a supporting signal.
 *   - 7 weekday labels with flame icons: lit = active day, today = emphasized.
 *   - Copy is encouraging, never shaming. "Every day is a fresh start."
 *
 * Props:
 *   streakCount        — consecutive active days
 *   streakLastActive   — ISO date string of last active day (e.g. "2026-06-17")
 */

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

// ── Day labels ────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return the ISO date string (YYYY-MM-DD) for a given offset from today. */
function isoDay(offsetFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetFromToday);
  return d.toISOString().split("T")[0];
}

/** Encouraging copy based on streak length and whether it's still active. */
function streakCopy(count: number, isActiveToday: boolean): string {
  if (!isActiveToday && count > 0) return "Continue today to keep your streak going.";
  if (count === 0) return "Start your streak — learn something today!";
  if (count === 1) return "Great start. Come back tomorrow to build your streak.";
  if (count < 4) return `${count} days in a row — you're building momentum!`;
  if (count < 7) return `${count} days strong. You're on a real roll!`;
  if (count < 14) return `${count}-day streak! Consistency is your superpower.`;
  if (count < 30) return `${count} days — that's exceptional dedication!`;
  return `${count}-day streak. You're in rare company.`;
}

// ── Single flame cell ─────────────────────────────────────────────────────────

interface DayCellProps {
  label: string;
  isLit: boolean;
  isToday: boolean;
}

function DayCell({ label, isLit, isToday }: DayCellProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={isToday && isLit ? { scale: 0.85 } : false}
      animate={isToday && isLit ? { scale: 1 } : {}}
      transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.1 }}
    >
      {/* Flame icon */}
      <div
        className="flex items-center justify-center rounded-full transition-colors duration-200"
        style={{
          width: 32,
          height: 32,
          background: isLit
            ? isToday
              ? "rgba(255,150,0,0.15)"
              : "rgba(255,150,0,0.08)"
            : "var(--color-surface-2)",
          border: isToday
            ? "1.5px solid var(--color-accent-orange)"
            : "1.5px solid transparent",
        }}
        aria-hidden
      >
        <Flame
          size={15}
          strokeWidth={0}
          fill={
            isLit
              ? isToday
                ? "var(--color-accent-orange)"
                : "#FFBB66"
              : "var(--color-border)"
          }
        />
      </div>

      {/* Day label */}
      <span
        className="text-[10px] font-bold leading-none"
        style={{
          color: isToday
            ? "var(--color-accent-orange)"
            : isLit
            ? "var(--color-fg-muted)"
            : "var(--color-fg-faint)",
        }}
      >
        {label}
      </span>
    </motion.div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

interface StreakStripProps {
  streakCount: number;
  streakLastActive: string | null;
  /** Optional className for the outer wrapper */
  className?: string;
}

export function StreakStrip({
  streakCount,
  streakLastActive,
  className,
}: StreakStripProps) {
  const today = isoDay(0);

  // Build the 7-day window: [6 days ago … today]
  const days = Array.from({ length: 7 }, (_, i) => {
    const offset = i - 6; // -6 … 0
    const date = isoDay(offset);
    const dayOfWeek = new Date(date + "T12:00:00").getDay(); // 0=Sun … 6=Sat
    // Remap to Mon-first index: Mon=0 … Sun=6
    const labelIndex = (dayOfWeek + 6) % 7;

    // A day is "lit" if it falls within the active streak window
    let isLit = false;
    if (streakLastActive && streakCount > 0) {
      const lastActiveDate = new Date(streakLastActive + "T12:00:00");
      const thisDate = new Date(date + "T12:00:00");
      // First day of the streak window
      const firstActiveDate = new Date(lastActiveDate);
      firstActiveDate.setDate(lastActiveDate.getDate() - streakCount + 1);
      isLit = thisDate >= firstActiveDate && thisDate <= lastActiveDate;
    }

    return {
      date,
      label: DAY_LABELS[labelIndex],
      isLit,
      isToday: date === today,
    };
  });

  const isActiveToday = streakLastActive === today;

  return (
    <div className={className}>
      {/* Day flames row */}
      <div className="flex items-end justify-between gap-1">
        {days.map((day) => (
          <DayCell
            key={day.date}
            label={day.label}
            isLit={day.isLit}
            isToday={day.isToday}
          />
        ))}
      </div>

      {/* Encouraging copy */}
      <p
        className="mt-3 text-xs leading-snug"
        style={{ color: "var(--color-fg-muted)" }}
      >
        {streakCopy(streakCount, isActiveToday)}
      </p>
    </div>
  );
}
