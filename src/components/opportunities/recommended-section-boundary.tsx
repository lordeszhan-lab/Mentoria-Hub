"use client";

/**
 * Suspense wrapper for the recommended section.
 * Accepts server components as `children` from a Server Component parent —
 * must NOT import server-only modules here.
 */
import { Suspense, type ReactNode } from "react";
import { RecommendedSectionSkeleton } from "./recommended-section-skeleton";

export function RecommendedSectionWithFallback({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RecommendedSectionSkeleton />}>{children}</Suspense>;
}
