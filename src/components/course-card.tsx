"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, Layers } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CATEGORY_MAP } from "@/lib/categories";
import { enroll } from "@/server/courses/actions";
import type { CourseRow, CategoryRow } from "@/lib/supabase/types";
import { dur, ease } from "@/lib/motion/tokens";

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
} as const;

// ── Progress ring (SVG, always brand green) ───────────────────────────────────

function ProgressRing({ pct, size = 40, stroke = 4 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{
          transformOrigin: "center",
          transform: "rotate(-90deg)",
          transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={size * 0.24}
        fontWeight={700}
        fill="var(--color-fg)"
      >
        {pct}%
      </text>
    </svg>
  );
}

// ── Card entrance animation ───────────────────────────────────────────────────

const cardVariant = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: dur.base, ease: ease.out, delay: Math.min(i * 0.045, 0.35) },
  }),
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CourseCardProps {
  course: CourseRow;
  category: CategoryRow | null;
  index?: number;
  enrolled?: boolean;
  progressPct?: number;
  totalLessons?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CourseCard({
  course,
  category,
  index = 0,
  enrolled = false,
  progressPct = 0,
  totalLessons = 0,
}: CourseCardProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const catMeta = category
    ? CATEGORY_MAP[category.slug as keyof typeof CATEGORY_MAP] ?? null
    : null;

  const estimatedH = course.estimated_minutes
    ? course.estimated_minutes < 60
      ? `${course.estimated_minutes}m`
      : `${Math.round(course.estimated_minutes / 60)}h`
    : null;

  function handleEnroll(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        await enroll(course.id);
      } catch {
        toast.error("Could not enroll. Please try again.");
        router.refresh();
      }
    });
  }

  return (
    <motion.article
      variants={cardVariant}
      initial="hidden"
      animate="show"
      custom={index}
      className="group relative flex flex-col rounded-2xl bg-[--color-surface] overflow-hidden cursor-pointer"
      style={{ boxShadow: "var(--shadow-card)" }}
      whileHover={{
        y: -2,
        boxShadow: "var(--shadow-card-hover)",
        transition: { duration: 0.18, ease: "easeOut" },
      }}
    >
      {/* Stretched link — covers card */}
      <Link
        href={`/courses/${course.slug}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-2 focus-visible:outline-[--color-brand]"
        aria-label={course.title}
        tabIndex={0}
      />

      <div className="relative z-0 flex flex-col gap-3 p-5 flex-1">
        {/* Top row: chips + progress ring */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {catMeta ? (
              <span
                className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-semibold shrink-0"
                style={{ background: `${catMeta.chipInk}14`, color: catMeta.chipInk }}
              >
                <catMeta.Icon size={10} strokeWidth={1.6} aria-hidden />
                {catMeta.name}
              </span>
            ) : null}
            <span className="inline-flex items-center h-5 px-2 rounded-full border border-[--color-border] text-[11px] font-medium text-[--color-fg-muted]">
              {LEVEL_LABELS[course.level as keyof typeof LEVEL_LABELS] ?? course.level}
            </span>
          </div>

          {enrolled && <ProgressRing pct={progressPct} />}
        </div>

        {/* Title */}
        <span className="font-extrabold text-[--color-fg] text-sm leading-snug line-clamp-2 group-hover:text-brand transition-colors duration-200">
          {course.title}
        </span>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[--color-fg-muted]">
          {totalLessons > 0 && (
            <span className="inline-flex items-center gap-1">
              <Layers size={11} strokeWidth={1.6} aria-hidden />
              {totalLessons} lesson{totalLessons === 1 ? "" : "s"}
            </span>
          )}
          {estimatedH && (
            <span className="inline-flex items-center gap-1">
              <Clock size={11} strokeWidth={1.6} aria-hidden />
              {estimatedH}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-[12px] text-[--color-fg-muted] line-clamp-2 leading-relaxed flex-1">
          {course.description}
        </p>
      </div>

      {/* CTA footer */}
      <div className="relative z-20 px-5 pb-5 pt-0">
        <button
          type="button"
          onClick={handleEnroll}
          disabled={isPending}
          aria-label={enrolled ? "Continue course" : "Enroll in course"}
          className={cn(
            "w-full h-10 rounded-full text-sm font-semibold text-white",
            "bg-brand hover:bg-brand-strong active:scale-[0.99]",
            "transition-all duration-200",
            isPending ? "opacity-70 cursor-wait" : "cursor-pointer",
          )}
        >
          {isPending ? "…" : enrolled ? "Continue" : "Enroll"}
        </button>
      </div>
    </motion.article>
  );
}
