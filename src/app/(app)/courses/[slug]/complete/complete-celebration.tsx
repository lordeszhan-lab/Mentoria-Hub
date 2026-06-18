"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

/** Fires a confetti burst once on mount. */
export function CompleteCelebration() {
  useEffect(() => {
    // Double-burst for more celebration.
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ["#16A34A", "#1CB0F6", "#FFC800", "#FF9600", "#CE82FF"],
      ticks: 100,
    });
    const t = setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 120,
        origin: { y: 0.55, x: 0.3 },
        colors: ["#16A34A", "#1CB0F6", "#FFC800"],
        ticks: 80,
      });
    }, 400);
    return () => clearTimeout(t);
  }, []);

  return null;
}
