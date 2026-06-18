import { OpportunityGridSkeleton } from "@/components/opportunity-card-skeleton";

/**
 * Next.js loading.tsx — shown while the server component fetches data.
 * Mirrors the exact grid layout to prevent layout shift.
 */
export default function OpportunitiesLoading() {
  return (
    <div className="min-h-screen bg-[--color-canvas]">
      {/* Filter bar placeholder */}
      <div className="sticky top-0 z-20 bg-[--color-canvas]/90 backdrop-blur-md border-b border-[--color-border]/60 px-4 pt-4 pb-3">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-3">
            <div className="h-7 w-36 rounded-lg bg-[--color-border] animate-pulse" />
            <div className="h-4 w-20 rounded-lg bg-[--color-border] animate-pulse" />
          </div>
          {/* Filter bar skeleton */}
          <div className="rounded-2xl bg-[--color-surface] border border-[--color-border] px-4 py-3 space-y-3">
            <div className="h-9 w-full rounded-xl bg-[--color-border] animate-pulse" />
            <div className="flex gap-2">
              {[24, 20, 28, 22, 18, 30].map((w, i) => (
                <div
                  key={i}
                  className="h-7 rounded-full bg-[--color-border] animate-pulse"
                  style={{ width: `${w * 4}px` }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {[96, 80, 72, 88].map((w, i) => (
                <div
                  key={i}
                  className="h-8 rounded-xl bg-[--color-border] animate-pulse"
                  style={{ width: `${w}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-16">
        <OpportunityGridSkeleton count={8} />
      </main>
    </div>
  );
}
