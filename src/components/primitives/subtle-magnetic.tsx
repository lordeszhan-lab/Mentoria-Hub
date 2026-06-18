"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

interface Props {
  children: ReactNode;
  /** Max pixel displacement toward the cursor. */
  strength?: number;
}

/**
 * Wraps a child and gives it a subtle "magnetic" pull toward the cursor on
 * hover. Used on secondary CTAs and inline links. Mirrors Seobloom's
 * SubtleMagnetic. Respects prefers-reduced-motion by simply not binding.
 */
export function SubtleMagnetic({ children, strength = 6 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 20, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 250, damping: 20, mass: 0.4 });

  function onMove(e: React.MouseEvent<HTMLSpanElement>) {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(relX, relY) || 1;
    const cap = strength / Math.max(dist / 24, 1);
    x.set((relX / dist) * cap * (dist / 24));
    y.set((relY / dist) * cap * (dist / 24));
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy, display: "inline-flex" }}
    >
      {children}
    </motion.span>
  );
}
