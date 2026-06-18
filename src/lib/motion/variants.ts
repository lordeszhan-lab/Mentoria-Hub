import type { Variants } from "motion/react";
import { ease, dur } from "@/lib/motion/tokens";

/**
 * Shared motion variants used across the marketing site.
 * Mirrors the Seobloom system 1:1.
 */

// Simple fade + rise. Used for hero visual, generic blocks.
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.slow, ease: ease.out },
  },
};

// Hero headline container — staggers each word child.
export const heroContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

// Each hero word — blurred slide-up to sharp.
export const heroWord: Variants = {
  hidden: { opacity: 0, y: "0.6em", filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: "0em",
    filter: "blur(0px)",
    transition: { duration: dur.hero, ease: ease.out },
  },
};
