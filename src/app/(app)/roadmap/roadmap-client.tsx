"use client";

/**
 * RoadmapClient — premium roadmap UI.
 *
 * Design language: calm / expensive / ONE green accent (brand).
 * White cards · soft shadows · generous padding · single accent.
 * Motion: spring entrance, tasteful hover, reduced-motion safe.
 */

import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Trophy,
  BookOpen,
  Target,
  Lock,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Calendar,
  Loader2,
  Map as MapIcon,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  generateRoadmapAction,
  setStepStatusAction,
  type RoadmapData,
  type StepWithLinks,
} from "@/server/roadmap/actions";
import type { RoadmapStepStatus, RoadmapStepKind } from "@/lib/supabase/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const TERM_ORDER: Record<string, number> = { fall: 0, spring: 1, summer: 2, other: 3 };

const KIND_ICON: Record<RoadmapStepKind, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  opportunity: Trophy,
  course: BookOpen,
  action: Target,
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initial: RoadmapData | null;
}

type GradeGroup = {
  grade: number;
  terms: { key: string; steps: StepWithLinks[] }[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNextMove(steps: StepWithLinks[]): StepWithLinks | null {
  const candidates = steps.filter(
    (s) => s.status === "available" || s.status === "in_progress",
  );
  if (!candidates.length) return null;

  const withDeadline = [...candidates.filter((s) => s.deadline != null)].sort(
    (a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime(),
  );
  const withoutDeadline = [...candidates.filter((s) => s.deadline == null)].sort(
    (a, b) => a.grade - b.grade || a.order_index - b.order_index,
  );

  return withDeadline[0] ?? withoutDeadline[0] ?? null;
}

function groupByGradeTerm(steps: StepWithLinks[]): GradeGroup[] {
  const gradeMap = new Map<number, Map<string, StepWithLinks[]>>();
  for (const step of steps) {
    if (!gradeMap.has(step.grade)) gradeMap.set(step.grade, new Map());
    const termKey = step.term ?? "other";
    const termMap = gradeMap.get(step.grade)!;
    if (!termMap.has(termKey)) termMap.set(termKey, []);
    termMap.get(termKey)!.push(step);
  }
  return [...gradeMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([grade, termMap]) => ({
      grade,
      terms: [...termMap.entries()]
        .sort(([a], [b]) => (TERM_ORDER[a] ?? 9) - (TERM_ORDER[b] ?? 9))
        .map(([key, steps]) => ({ key, steps })),
    }));
}

function deadlineMeta(
  deadline: string | null,
): { label: string; textCls: string; bgCls: string } | null {
  if (!deadline) return null;
  const days = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return { label: "Overdue", textCls: "text-red-600", bgCls: "bg-red-50" };
  if (days <= 7) return { label: `${days}d left`, textCls: "text-orange-600", bgCls: "bg-orange-50" };
  if (days <= 30) return { label: `${days}d left`, textCls: "text-yellow-700", bgCls: "bg-yellow-50" };
  return {
    label: new Date(deadline).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    textCls: "text-fg-muted",
    bgCls: "bg-surface",
  };
}

function gradeStepCounts(group: GradeGroup) {
  const all = group.terms.flatMap((t) => t.steps);
  return { total: all.length, done: all.filter((s) => s.status === "done").length };
}

// ── GeneratingView ────────────────────────────────────────────────────────────

function GeneratingView() {
  const t = useTranslations("roadmap");
  const LOADING_MESSAGES = [
    t("loadingProfile"),
    t("loadingMatching"),
    t("loadingSequencing"),
    t("loadingAlmost"),
  ];
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const t = setInterval(() => {
      setVisible(false);
      const swap = setTimeout(() => {
        setIdx((i) => (i + 1) % LOADING_MESSAGES.length);
        setVisible(true);
      }, 250);
      return () => clearTimeout(swap);
    }, 2500);
    return () => clearInterval(t);
  }, [reducedMotion]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-card">
        {/* Spinner */}
        <div className="mb-6 flex justify-center">
          {reducedMotion ? (
            <div className="size-10 rounded-full bg-brand-soft flex items-center justify-center">
              <Loader2 className="size-5 text-brand" strokeWidth={1.6} />
            </div>
          ) : (
            <Loader2
              className="size-10 text-brand animate-spin"
              strokeWidth={1.5}
              aria-hidden
            />
          )}
        </div>

        {/* Cycling status text */}
        <p
          className="text-center text-sm font-medium text-fg-muted transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
          aria-live="polite"
          aria-label="Generating roadmap"
        >
          {reducedMotion ? "Generating your roadmap…" : LOADING_MESSAGES[idx]}
        </p>

        {/* Skeleton timeline preview */}
        {!reducedMotion && (
          <div className="mt-6 space-y-2.5" aria-hidden>
            {[100, 85, 70].map((w, i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-canvas animate-pulse"
                style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}

        <p className="mt-5 text-center text-xs text-fg-faint">
          {t("loadingAlmost")}
        </p>
      </div>
    </div>
  );
}

// ── StepCard ──────────────────────────────────────────────────────────────────

function StepCard({
  step,
  pulsing,
  onStatusChange,
  isNextMove,
}: {
  step: StepWithLinks;
  pulsing: boolean;
  onStatusChange: (id: string, status: RoadmapStepStatus) => void;
  isNextMove: boolean;
}) {
  const router = useRouter();
  const KindIcon = KIND_ICON[step.kind];
  const dlMeta = deadlineMeta(step.deadline);
  const isLocked = step.status === "locked";
  const isDone = step.status === "done";
  const isInProgress = step.status === "in_progress";

  function handleStart() {
    onStatusChange(step.id, "in_progress");
    // Navigate to the linked resource if one exists; plain action steps stay on roadmap
    if (step.opportunity) {
      router.push(`/opportunities/${step.opportunity.slug}`);
    } else if (step.course) {
      router.push(`/courses/${step.course.slug}`);
    }
  }

  return (
    <motion.div
      layout
      animate={
        pulsing
          ? {
              scale: [1, 1.02, 1],
              boxShadow: [
                "var(--shadow-card)",
                "0 0 0 4px rgba(22,163,74,0.15)",
                "var(--shadow-card)",
              ],
            }
          : {}
      }
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 shadow-card",
        "transition-shadow duration-200 hover:shadow-card-hover",
        isDone && "opacity-55",
        isNextMove && !isDone && "ring-2 ring-brand/30",
      )}
    >
      <div className="flex gap-3">
        {/* Kind icon chip — single green accent */}
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <KindIcon className="size-4" strokeWidth={1.6} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Title row */}
          <div className="flex items-start gap-2">
            <p
              className={cn(
                "flex-1 text-sm font-semibold leading-snug text-fg",
                isDone && "line-through decoration-fg-muted/60",
              )}
            >
              {step.title}
            </p>
            {isDone && (
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.6}
              />
            )}
            {isLocked && (
              <Lock
                className="mt-0.5 size-3.5 shrink-0 text-fg-faint"
                strokeWidth={1.6}
              />
            )}
          </div>

          {/* Rationale */}
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">
            {step.rationale}
          </p>

          {/* Linked chips */}
          {step.opportunity && (
            <Link
              href={`/opportunities/${step.opportunity.slug}`}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-canvas px-2.5 py-0.5 text-xs font-medium text-fg transition-colors hover:border-brand/40 hover:bg-brand-soft"
            >
              <Trophy className="size-3 text-brand" strokeWidth={1.6} />
              {step.opportunity.title}
            </Link>
          )}
          {step.course && (
            <Link
              href={`/courses/${step.course.slug}`}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-canvas px-2.5 py-0.5 text-xs font-medium text-fg transition-colors hover:border-brand/40 hover:bg-brand-soft"
            >
              <BookOpen className="size-3 text-brand" strokeWidth={1.6} />
              {step.course.title}
            </Link>
          )}

          {/* Meta row */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {dlMeta && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border border-border/50",
                  dlMeta.bgCls,
                  dlMeta.textCls,
                )}
              >
                <Calendar className="size-3" strokeWidth={1.6} />
                {dlMeta.label}
              </span>
            )}
            {/* Status controls — always visible, clearly readable */}
            {!isLocked && !isDone && (
              <div className="ml-auto flex items-center gap-1.5">
                {isInProgress && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                    <span className="inline-block size-1.5 animate-pulse rounded-full bg-brand" />
                    In progress
                  </span>
                )}
                {step.status === "available" && (
                  <StepStartButton onStart={handleStart} />
                )}
                <StepMarkDoneButton onDone={() => onStatusChange(step.id, "done")} />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Helper buttons (need translation hooks) ───────────────────────────────────

function StepStartButton({ onStart }: { onStart: () => void }) {
  const t = useTranslations("common");
  return (
    <button
      onClick={onStart}
      className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand-strong active:scale-[0.98]"
    >
      {t("start")}
    </button>
  );
}

function StepMarkDoneButton({ onDone }: { onDone: () => void }) {
  const t = useTranslations("common");
  return (
    <button
      onClick={onDone}
      className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-fg transition-all hover:border-brand hover:text-brand active:scale-[0.98]"
    >
      {t("markDone")}
    </button>
  );
}

// ── NextMoveCard ──────────────────────────────────────────────────────────────

function NextMoveCard({
  step,
  onStatusChange,
}: {
  step: StepWithLinks;
  onStatusChange: (id: string, status: RoadmapStepStatus) => void;
}) {
  const router = useRouter();
  const dlMeta = deadlineMeta(step.deadline);

  function handleStart() {
    onStatusChange(step.id, "in_progress");
    if (step.opportunity) {
      router.push(`/opportunities/${step.opportunity.slug}`);
    } else if (step.course) {
      router.push(`/courses/${step.course.slug}`);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 rounded-2xl bg-brand p-6 text-white shadow-pop"
    >
      {/* Eyebrow — no icon, just clean typography */}
      <NextMoveEyebrow />

      <p className="text-lg font-bold leading-snug text-white">{step.title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-white/75">{step.rationale}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {dlMeta && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
            <Calendar className="size-3" strokeWidth={1.6} />
            {dlMeta.label}
          </span>
        )}
        <NextMoveCTAs
          step={step}
          onStart={handleStart}
          onDone={() => onStatusChange(step.id, "done")}
        />
      </div>
    </motion.div>
  );
}

// ── NextMoveCTAs ──────────────────────────────────────────────────────────────

function NextMoveCTAs({
  step,
  onStart,
  onDone,
}: {
  step: StepWithLinks;
  onStart: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("common");
  const tCourses = useTranslations("courses");
  return (
    <div className="ml-auto flex items-center gap-2.5">
      {step.status === "available" && (
        <button
          onClick={onStart}
          className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/15 active:scale-[0.98]"
        >
          {t("start")}
        </button>
      )}
      {step.opportunity && (
        <Link
          href={`/opportunities/${step.opportunity.slug}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand transition-all hover:bg-white/90 active:scale-[0.98]"
        >
          {t("apply")}
          <ArrowRight className="size-3.5" strokeWidth={1.6} />
        </Link>
      )}
      {step.course && (
        <Link
          href={`/courses/${step.course.slug}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand transition-all hover:bg-white/90 active:scale-[0.98]"
        >
          {tCourses("startCourse")}
          <ArrowRight className="size-3.5" strokeWidth={1.6} />
        </Link>
      )}
      {!step.opportunity && !step.course && (
        <button
          onClick={onDone}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand transition-all hover:bg-white/90 active:scale-[0.98]"
        >
          {t("markDone")}
          <CheckCircle2 className="size-3.5" strokeWidth={1.6} />
        </button>
      )}
    </div>
  );
}

// ── NextMoveEyebrow ───────────────────────────────────────────────────────────

function NextMoveEyebrow() {
  const t = useTranslations("roadmap");
  return (
    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/60">
      {t("yourNextMove")}
    </p>
  );
}

// ── YearRail ──────────────────────────────────────────────────────────────────

function YearRail({
  grouped,
  expandedGrades,
  onToggle,
}: {
  grouped: GradeGroup[];
  expandedGrades: Set<number>;
  onToggle: (grade: number) => void;
}) {
  return (
    <nav aria-label="Grade navigation" className="hidden lg:block w-52 shrink-0">
      <div className="sticky top-20 space-y-1">
        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-fg-faint">
          Grades
        </p>
        {grouped.map((group) => {
          const { total, done } = gradeStepCounts(group);
          const pct = total > 0 ? (done / total) * 100 : 0;
          const active = expandedGrades.has(group.grade);

          return (
            <button
              key={group.grade}
              type="button"
              onClick={() => {
                document
                  .getElementById(`grade-${group.grade}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
                if (!active) onToggle(group.grade);
              }}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                "hover:bg-brand-soft/60",
                active && "bg-brand-soft/40",
              )}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  active
                    ? "bg-brand text-white"
                    : "border border-border bg-surface text-fg-muted",
                )}
              >
                {group.grade}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    active ? "text-fg" : "text-fg-muted",
                  )}
                >
                  Grade {group.grade}
                </p>
                <p className="text-xs text-fg-faint">
                  {done}/{total} done
                </p>
                {total > 0 && (
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── RoadmapClient (main) ──────────────────────────────────────────────────────

export function RoadmapClient({ initial }: Props) {
  const t = useTranslations("roadmap");
  const tCommon = useTranslations("common");
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(initial);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);
  const [donePulseId, setDonePulseId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isPending, startTransition] = useTransition();

  // Expand the first (current) grade by default; collapse the rest
  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(() => {
    const grades = [...new Set((initial?.steps ?? []).map((s) => s.grade))].sort(
      (a, b) => a - b,
    );
    return new Set(grades.slice(0, 1));
  });

  const steps = roadmapData?.steps ?? [];
  const doneCount = steps.filter((s) => s.status === "done").length;
  const railPct = steps.length > 0 ? (doneCount / steps.length) * 100 : 0;
  const nextMove = roadmapData ? getNextMove(steps) : null;
  const grouped = roadmapData ? groupByGradeTerm(steps) : [];

  const profileChanged =
    roadmapData != null &&
    new Date(roadmapData.profileUpdatedAt) > new Date(roadmapData.roadmap.generated_at);

  function toggleGrade(grade: number) {
    setExpandedGrades((prev) => {
      const next = new Set(prev);
      if (next.has(grade)) next.delete(grade);
      else next.add(grade);
      return next;
    });
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    const res = await generateRoadmapAction();
    setGenerating(false);
    if ("error" in res) {
      setError(res.error);
    } else {
      setRoadmapData(res.data);
      setRegenOpen(false);
      // Expand first grade after generation
      const grades = [...new Set(res.data.steps.map((s) => s.grade))].sort(
        (a, b) => a - b,
      );
      setExpandedGrades(new Set(grades.slice(0, 1)));
    }
  }

  function handleStatusChange(stepId: string, status: RoadmapStepStatus) {
    if (status === "done") {
      setDonePulseId(stepId);
      setTimeout(() => setDonePulseId(null), 600);
    }

    // Optimistic update
    setRoadmapData((prev) => {
      if (!prev) return prev;
      const updated = prev.steps.map((s) => (s.id === stepId ? { ...s, status } : s));

      if (status === "done") {
        const target = prev.steps.find((s) => s.id === stepId);
        if (target) {
          const nextLocked = updated
            .filter(
              (s) =>
                s.grade === target.grade &&
                s.status === "locked" &&
                s.order_index > target.order_index,
            )
            .sort((a, b) => a.order_index - b.order_index)[0];
          if (nextLocked) {
            return {
              ...prev,
              steps: updated.map((s) =>
                s.id === nextLocked.id ? { ...s, status: "available" } : s,
              ),
            };
          }
        }
      }

      return { ...prev, steps: updated };
    });

    startTransition(async () => {
      const res = await setStepStatusAction(stepId, status);
      if ("error" in res) console.error("[roadmap] setStepStatus:", res.error);
    });
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (!roadmapData && !generating) {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-canvas">
        <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-10 text-center shadow-card"
          >
            {/* Icon chip — no sparkles */}
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-brand-soft">
              <MapIcon size={24} strokeWidth={1.6} className="text-brand" />
            </div>

            <h1 className="mb-2 text-xl font-extrabold tracking-tight text-fg">
              {t("emptyTitle")}
            </h1>
            <p className="mb-8 text-sm leading-relaxed text-fg-muted">
              {t("emptySubtitle")}
            </p>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 flex items-center gap-2 overflow-hidden rounded-xl bg-red-50 p-3 text-left text-sm text-red-600"
                >
                  <AlertCircle className="size-4 shrink-0" strokeWidth={1.6} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Primary CTA — solid green, readable */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-brand-strong active:scale-[0.99] disabled:opacity-50"
            >
              {t("generate")}
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  if (generating) {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-canvas">
        <GeneratingView />
      </main>
    );
  }

  // ── Populated state ───────────────────────────────────────────────────────

  return (
    <main className="min-h-[calc(100vh-56px)] bg-canvas">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 lg:px-8">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mb-2"
        >
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">Your Roadmap</h1>
          {roadmapData?.roadmap.goal_snapshot && (
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">
              {roadmapData.roadmap.goal_snapshot}
            </p>
          )}
        </motion.div>

        {/* Overall progress bar */}
        {steps.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 mt-4 flex items-center gap-3"
          >
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full rounded-full bg-brand"
                initial={{ width: 0 }}
                animate={{ width: `${railPct}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="shrink-0 text-xs font-semibold text-fg-muted">
              {doneCount} / {steps.length} done
            </span>
          </motion.div>
        )}

        {/* Profile-changed nudge */}
        <AnimatePresence>
          {profileChanged && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
            >
              <AlertCircle className="size-4 shrink-0" strokeWidth={1.6} />
              Your profile changed — regenerate for a fresher plan.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next move hero — full width */}
        {nextMove && (
          <NextMoveCard step={nextMove} onStatusChange={handleStatusChange} />
        )}

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 flex items-start gap-2 overflow-hidden rounded-xl bg-red-50 p-3 text-sm text-red-600"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={1.6} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two-panel: left year rail + right content */}
        <div className="flex items-start gap-8">
          <YearRail
            grouped={grouped}
            expandedGrades={expandedGrades}
            onToggle={toggleGrade}
          />

          {/* Main grade sections */}
          <div className="min-w-0 flex-1 space-y-4">
            {grouped.map(({ grade, terms }, i) => {
              const isExpanded = expandedGrades.has(grade);
              const { total, done } = gradeStepCounts({ grade, terms });

              return (
                <motion.section
                  key={grade}
                  id={`grade-${grade}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden"
                >
                  {/* Grade header — clickable collapse toggle */}
                  <button
                    type="button"
                    onClick={() => toggleGrade(grade)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-canvas"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                        {grade}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-fg">Grade {grade}</h2>
                        <p className="text-xs text-fg-muted">
                          {done} of {total} steps done
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-4 text-fg-faint transition-transform duration-200",
                        isExpanded && "rotate-180",
                      )}
                      strokeWidth={1.6}
                    />
                  </button>

                  {/* Collapsible body */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border px-6 pb-6 pt-5 space-y-6">
                          {terms.map(({ key, steps: termSteps }) => (
                            <div key={key}>
                              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-fg-faint">
                                {key === "fall" ? t("fall") : key === "spring" ? t("spring") : key === "summer" ? t("summer") : key}
                              </p>
                              {/* 2-column grid on md+, 1-col on mobile */}
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {termSteps.map((step) => (
                                  <StepCard
                                    key={step.id}
                                    step={step}
                                    pulsing={donePulseId === step.id}
                                    onStatusChange={handleStatusChange}
                                    isNextMove={nextMove?.id === step.id}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.section>
              );
            })}
          </div>
        </div>

        {/* Regenerate — outline pill, clearly readable */}
        <div className="mt-12 flex justify-center">
          <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
            <DialogTrigger
              render={
                <button className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg shadow-card transition-all hover:border-brand/40 hover:text-brand active:scale-[0.99]" />
              }
            >
              <RefreshCw className="size-3.5" strokeWidth={1.6} />
              {t("regenerate")}
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("regenerate")}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                {t("emptySubtitle")}
              </p>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  {tCommon("cancel")}
                </DialogClose>
                <Button disabled={generating} onClick={handleGenerate}>
                  {generating && <Loader2 className="size-4 animate-spin" />}
                  {t("regenerate")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </main>
  );
}
