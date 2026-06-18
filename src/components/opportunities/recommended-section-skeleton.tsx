import { AiWorkingLoader } from "@/components/ai-working-loader";

/**
 * Skeleton shown while RecommendedSection is loading inside Suspense.
 * Shows an animated "AI working" indicator so users know the section is alive.
 */
export function RecommendedSectionSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6">
      {/* Header with live AI status */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-base font-extrabold text-[--color-fg] tracking-tight">
          Recommended for you
        </h2>
        <AiWorkingLoader variant="inline" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-[--color-surface] overflow-hidden"
            style={{ minHeight: 220, boxShadow: "var(--shadow-card)" }}
          >
            <div className="p-5 flex flex-col gap-3">
              <div className="flex justify-between">
                <div className="h-5 w-20 rounded-full bg-[--color-border] animate-pulse" />
                <div className="h-5 w-14 rounded-full bg-[--color-border] animate-pulse" />
              </div>
              <div className="h-4 w-full rounded bg-[--color-border] animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-[--color-border] animate-pulse" />
              <div className="flex gap-2 mt-1">
                <div className="h-5 w-20 rounded-full bg-[--color-border] animate-pulse" />
                <div className="h-5 w-16 rounded-full bg-[--color-border] animate-pulse" />
              </div>
              <div className="h-12 w-full rounded bg-[--color-border]/60 animate-pulse mt-auto" />
            </div>
          </div>
        ))}
      </div>

      {/* Divider skeleton */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-[--color-border]" />
        <div className="h-3.5 w-28 rounded bg-[--color-border] animate-pulse" />
        <div className="flex-1 h-px bg-[--color-border]" />
      </div>
    </section>
  );
}
