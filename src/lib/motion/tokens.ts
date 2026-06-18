/**
 * Shared motion tokens. Every marketing component imports `ease` and `dur`
 * from here so timing is consistent across the whole landing page.
 *
 * Mirrors the Seobloom system 1:1.
 */

// Custom cubic-bezier easings (framer-motion / motion array form).
export const ease = {
  // Primary "ease-out" — most entrances use this.
  out: [0.22, 1, 0.36, 1] as const,
  // Snappier in-out for hovers / small interactions.
  inOut: [0.65, 0, 0.35, 1] as const,
  // Gentle ease for slow hero moments.
  soft: [0.16, 1, 0.3, 1] as const,
};

// Durations (seconds).
export const dur = {
  fast: 0.25,
  base: 0.4,
  slow: 0.6,
  hero: 0.9,
};
