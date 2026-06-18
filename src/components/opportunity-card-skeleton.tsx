import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-full bg-[--color-border]", className)}
    />
  );
}

export function OpportunityCardSkeleton() {
  return (
    <div
      className="flex flex-col rounded-2xl bg-[--color-surface] p-5 gap-3"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Category chip + match badge row */}
      <div className="flex items-center justify-between">
        <Bone className="h-5 w-20" />
        <Bone className="h-4 w-14" />
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Bone className="h-3.5 w-full rounded-lg" />
        <Bone className="h-3.5 w-4/5 rounded-lg" />
      </div>

      {/* Type + format badges */}
      <div className="flex gap-2">
        <Bone className="h-5 w-20" />
        <Bone className="h-5 w-16" />
      </div>

      {/* Description lines */}
      <div className="flex flex-col gap-1.5">
        <Bone className="h-3 w-full rounded-sm" />
        <Bone className="h-3 w-11/12 rounded-sm" />
        <Bone className="h-3 w-2/3 rounded-sm" />
      </div>

      {/* Deadline */}
      <Bone className="h-4 w-24" />

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <Bone className="size-8 shrink-0" />
        <Bone className="h-8 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function OpportunityGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <OpportunityCardSkeleton key={i} />
      ))}
    </div>
  );
}
