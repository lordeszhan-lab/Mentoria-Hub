"use client";

/**
 * XpStreakPill — compact header badge showing animated XP and learning streak.
 *
 * Design:  §5.6 app-header, §5.9 streak strip, §4 motion
 * - XP: star icon + count-up animation (tabular nums, --accent-yellow)
 * - Streak: flame icon (--accent-orange) + count; springs to 1.3× on increment
 */

import { useEffect, useRef, useState } from "react";
import { motion, animate, useAnimation } from "framer-motion";
import { Star, Flame } from "lucide-react";

// ── Animated number counter ───────────────────────────────────────────────────

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current ?? 0;
    const isFirstMount = prevRef.current === null;
    prevRef.current = value;

    const controls = animate(from, value, {
      duration: isFirstMount ? 0.7 : 0.45,
      ease: "easeOut",
      onUpdate(v) {
        setDisplay(Math.round(v));
      },
    });

    return () => controls.stop();
  }, [value]);

  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {display}
    </span>
  );
}

// ── Animated streak flame ─────────────────────────────────────────────────────

function StreakFlame({ streakCount }: { streakCount: number }) {
  const controls = useAnimation();
  const prevRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = streakCount;

    // Pulse spring only when streak actually incremented within the session
    if (prev !== null && streakCount > prev) {
      void controls.start({
        scale: [1, 1.35, 1.1, 1],
        transition: {
          duration: 0.55,
          times: [0, 0.3, 0.65, 1],
          ease: "easeOut",
        },
      });
    }
  }, [streakCount, controls]);

  return (
    <motion.span animate={controls} style={{ display: "inline-flex" }}>
      <Flame
        size={13}
        strokeWidth={0}
        fill="currentColor"
        aria-hidden
      />
    </motion.span>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

interface XpStreakPillProps {
  xp: number;
  streakCount: number;
}

/**
 * Compact pill: [★ {xp} XP · 🔥 {streak}]
 * Sits in the app header between nav and profile actions.
 */
export function XpStreakPill({ xp, streakCount }: XpStreakPillProps) {
  return (
    <div
      className="hidden sm:flex items-center gap-0.5 rounded-full border border-[--color-border] bg-[--color-surface-2] px-2.5 py-1 text-xs font-bold select-none"
      aria-label={`${xp} XP · ${streakCount}-day streak`}
    >
      {/* XP section */}
      <span
        className="flex items-center gap-1"
        style={{ color: "var(--color-accent-yellow)" }}
      >
        <Star size={11} strokeWidth={0} fill="currentColor" aria-hidden />
        <CountUp value={xp} />
        <span
          className="font-semibold"
          style={{ color: "var(--color-fg-muted)" }}
        >
          XP
        </span>
      </span>

      {/* Divider */}
      <span
        className="mx-1.5 h-3 w-px rounded-full"
        style={{ background: "var(--color-border)" }}
        aria-hidden
      />

      {/* Streak section */}
      <span
        className="flex items-center gap-1"
        style={{ color: streakCount > 0 ? "var(--color-accent-orange)" : "var(--color-fg-faint)" }}
      >
        <StreakFlame streakCount={streakCount} />
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{streakCount}</span>
      </span>
    </div>
  );
}
