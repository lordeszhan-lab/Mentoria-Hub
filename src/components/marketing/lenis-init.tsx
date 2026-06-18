"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Mounts Lenis smooth scroll on the marketing layout and exposes the instance
 * as `window.__lenis` so BackgroundGrid (and any future parallax component)
 * can read actualScroll without importing Lenis itself.
 *
 * This component renders nothing — it's a pure side-effect initialiser.
 */
export function LenisInit() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2 });

    (window as unknown as { __lenis: Lenis }).__lenis = lenis;

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__lenis;
    };
  }, []);

  return null;
}
