"use client";

import { useEffect, useRef } from "react";

/**
 * Page-wide dotted grid background. Drifts upward on scroll at 0.05x rate
 * (subtle parallax). Sits behind all content at -z-50.
 *
 * Reads scroll from window.__lenis if present (smooth), falls back to scrollY.
 * Mirrors Seobloom's BackgroundGrid 1:1.
 */
export function BackgroundGrid() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const lenis = (
        window as unknown as { __lenis?: { actualScroll?: number } }
      ).__lenis;
      const y = lenis?.actualScroll ?? window.scrollY;
      if (ref.current) {
        ref.current.style.transform = `translate3d(0, ${-y * 0.05}px, 0)`;
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-50 will-change-transform"
      style={{
        backgroundImage:
          "radial-gradient(circle at center, var(--color-fg-muted) 0.4px, transparent 0.4px)",
        backgroundSize: "32px 32px",
        opacity: 0.18,
        maskImage:
          "radial-gradient(ellipse 100% 80% at center, black 0%, transparent 90%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 100% 80% at center, black 0%, transparent 90%)",
      }}
    />
  );
}
