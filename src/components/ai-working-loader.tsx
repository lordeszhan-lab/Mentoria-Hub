"use client";

/**
 * AiWorkingLoader — animated "AI is working" indicator.
 * Cycles through status messages every 2.5 s so the user knows something
 * is actively happening (not a frozen page).
 *
 * variant="block"  — branded card shell used on the detail page match section.
 * variant="inline" — compact row used in the "Recommended for you" heading area.
 *
 * Respects prefers-reduced-motion: spin and message cycling stop; only a
 * static "Analysing…" label is shown.
 */

import { useEffect, useRef, useState } from "react";

interface AiWorkingLoaderProps {
  variant?: "block" | "inline";
  messages?: string[];
}

const DEFAULT_BLOCK_MESSAGES = [
  "Analysing this opportunity for you…",
  "Matching it to your profile…",
  "Reviewing eligibility and fit…",
  "Almost there…",
];

const DEFAULT_INLINE_MESSAGES = [
  "Personalising your matches…",
  "Scoring opportunities with AI…",
  "Ranking your best fits…",
  "Almost ready…",
];

export function AiWorkingLoader({
  variant = "inline",
  messages,
}: AiWorkingLoaderProps) {
  const resolvedMessages =
    messages ?? (variant === "block" ? DEFAULT_BLOCK_MESSAGES : DEFAULT_INLINE_MESSAGES);

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  // Detect reduced-motion preference (SSR-safe: default false, updated on mount)
  const [reducedMotion, setReducedMotion] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    intervalRef.current = setInterval(() => {
      // Fade out → swap text → fade in
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % resolvedMessages.length);
        setVisible(true);
      }, 250);
    }, 2500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reducedMotion, resolvedMessages.length]);

  const currentText = reducedMotion ? "Analysing…" : resolvedMessages[index];

  if (variant === "block") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        {!reducedMotion && (
          <span
            className="block size-5 rounded-full border-2 border-brand border-t-transparent animate-spin"
            aria-hidden
          />
        )}
        <p
          className="text-xs text-[--color-fg-muted] transition-opacity duration-250"
          style={{ opacity: visible ? 1 : 0 }}
          aria-live="polite"
          aria-label="AI is analysing"
        >
          {currentText}
        </p>
      </div>
    );
  }

  // inline variant
  return (
    <div className="flex items-center gap-2" aria-live="polite" aria-label="AI is working">
      {!reducedMotion && (
        <span
          className="block size-3.5 rounded-full border-2 border-brand border-t-transparent animate-spin shrink-0"
          aria-hidden
        />
      )}
      <span
        className="text-xs text-[--color-fg-muted] font-medium transition-opacity duration-250"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {currentText}
      </span>
    </div>
  );
}
