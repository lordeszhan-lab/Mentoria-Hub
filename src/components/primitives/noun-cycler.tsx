"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ease } from "@/lib/motion/tokens";

interface Props {
  words: string[];
  intervalMs?: number;
}

/**
 * Cycles through a list of words in place, with a small blur/slide swap.
 * Used in the hero subhead (e.g. "...into ChatGPT / Perplexity / Claude").
 * Mirrors Seobloom's NounCycler.
 *
 * Renders a fixed-width inline-block so surrounding text doesn't reflow.
 */
export function NounCycler({ words, intervalMs = 2400 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [words.length, intervalMs]);

  // Reserve width of the longest word to avoid layout shift.
  const longest = words.reduce((a, b) => (a.length >= b.length ? a : b), "");

  return (
    <span
      className="relative inline-grid align-baseline"
      style={{ minWidth: `${longest.length}ch` }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
          transition={{ duration: 0.3, ease: ease.out }}
          className="col-start-1 row-start-1 whitespace-nowrap"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
