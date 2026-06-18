"use client";

import {
  motion,
  useInView,
  animate,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ease, dur } from "@/lib/motion/tokens";

/**
 * Hero centerpiece. Mirrors Seobloom's DashboardMockup 1:1 in structure and
 * animation, rebuilt as Mentoria's ROADMAP command-center:
 *   - BrowserChrome (app.mentoriahub.kz/roadmap)
 *   - Sidebar (Roadmap / Opportunities / Courses / Mentor / Progress)
 *   - KPI row (live count-up: match, opportunities, streak)
 *   - Roadmap step grid (the 6 categories, live "match %" + sparkline)
 *   - Roadmap activity log (steps progress queued -> in progress -> done)
 *
 * Dark zinc-950 surface with green (emerald) as the single live accent —
 * exactly Seobloom's treatment.
 */

const STEP_TEMPLATES: Array<{ label: string; kind?: string; detail?: string }> =
  [
    { label: "STEM Olympiad Kazakhstan", kind: "Opportunity", detail: "due Oct 12 · 91% match" },
    { label: "Research Writing course", kind: "Course", detail: "module 2 of 4" },
    { label: "NIS Scholarship Application", kind: "Opportunity", detail: "due Jan 15" },
    { label: "University Essay Workshop", kind: "Course", detail: "starts soon" },
    { label: "Bolashak Pre-selection Test", kind: "Opportunity", detail: "unlocks in spring" },
    { label: "Financial Literacy course", kind: "Course", detail: "8 lessons" },
    { label: "MIT Science Award", kind: "Opportunity", detail: "84% match" },
    { label: "Build your research project", kind: "Action", detail: "portfolio piece" },
    { label: "Young Entrepreneurs Challenge", kind: "Opportunity", detail: "65% match" },
    { label: "Mock interview session", kind: "Action", detail: "with AI mentor" },
    { label: "Re-score your roadmap", kind: "Action", detail: "profile updated" },
    { label: "University Application Essentials", kind: "Course", detail: "0% · 10 lessons" },
  ];

const CATEGORIES = [
  { name: "STEM", abbr: "STM", initial: 91, trend: "+6%" },
  { name: "Science", abbr: "SCI", initial: 84, trend: "+4%" },
  { name: "Programming", abbr: "PRG", initial: 72, trend: "+9%" },
  { name: "Finance", abbr: "FIN", initial: 58, trend: "+3%" },
  { name: "Business", abbr: "BIZ", initial: 65, trend: "—" },
];

const TIME_LABELS = ["now", "1m ago", "3m ago", "8m ago", "now", "now", "2m ago"];

export function DashboardMockup() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-12 -bottom-12 h-40 rounded-[100%] bg-foreground/10 blur-3xl"
      />

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-zinc-800",
          "bg-zinc-950 text-zinc-100",
          "ring-1 ring-inset ring-white/[0.06]",
        )}
        style={{ boxShadow: "0 50px 100px -20px rgba(0,0,0,0.55)" }}
      >
        <BrowserChrome />
        <div className="grid grid-cols-[180px_1fr]">
          <Sidebar />
          <div>
            <TopBar />
            <main className="space-y-5 p-5">
              <KPIRow />
              <CategoryGrid />
              <RoadmapActivityLog />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowserChrome() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: dur.base, ease: ease.out }}
      className="flex h-10 items-center gap-2 border-b border-zinc-800 px-4"
    >
      <span className="size-2.5 rounded-full bg-[#ff5f56]" />
      <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
      <span className="size-2.5 rounded-full bg-[#27c93f]" />
      <div className="ml-4 max-w-md flex-1">
        <div className="rounded-md bg-zinc-900 px-3 py-1 font-mono text-[11px] text-zinc-500">
          app.mentoriahub.kz/roadmap
        </div>
      </div>
    </motion.div>
  );
}

function Sidebar() {
  return (
    <motion.aside
      initial={{ x: -8, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: dur.slow, ease: ease.out, delay: 0.2 }}
      className="hidden space-y-1 border-r border-zinc-800 p-3 md:block"
    >
      <div className="mb-2 flex items-center gap-2 px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
        Aruzhan · Grade 10
      </div>
      {[
        { label: "Roadmap", active: true },
        { label: "Opportunities" },
        { label: "Courses" },
        { label: "Mentor" },
        { label: "Progress" },
      ].map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px]",
            item.active ? "bg-zinc-800/70 text-zinc-100" : "text-zinc-400",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              item.active ? "bg-emerald-400" : "bg-zinc-700",
            )}
          />
          {item.label}
        </div>
      ))}
    </motion.aside>
  );
}

function TopBar() {
  const [labelIndex, setLabelIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setLabelIndex((i) => (i + 1) % TIME_LABELS.length),
      3000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ y: -6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: dur.slow, ease: ease.out, delay: 0.25 }}
      className="flex h-12 items-center justify-between border-b border-zinc-800 px-5"
    >
      <div className="flex items-center gap-2 text-[12.5px]">
        <span className="text-zinc-500">Grade 10</span>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-200">Spring 2026</span>
      </div>
      <div className="flex items-center gap-2">
        <motion.span
          className="size-1.5 rounded-full bg-emerald-500/80"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="font-mono text-[11px] text-zinc-500">
          Live ·{" "}
          <AnimatePresence mode="wait">
            <motion.span
              key={labelIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: ease.out }}
              className="inline-block min-w-[3.5em]"
            >
              {TIME_LABELS[labelIndex]}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
    </motion.div>
  );
}

function KPIRow() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } },
      }}
      className="grid grid-cols-3 gap-3"
    >
      <KPICard label="Roadmap progress" initial={40} suffix="%" delta="+8 this week" tickInterval={7000} />
      <KPICard label="Opportunities matched" initial={23} delta="+5 new this week" tickInterval={5000} />
      <KPICard label="Day streak" initial={12} delta="Keep it up" mutedDelta />
    </motion.div>
  );
}

function KPICard({
  label,
  initial,
  suffix,
  delta,
  mutedDelta = false,
  tickInterval,
}: {
  label: string;
  initial: number;
  suffix?: string;
  delta: string;
  mutedDelta?: boolean;
  tickInterval?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: dur.slow, ease: ease.out },
        },
      }}
      className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
    >
      <div className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
        <LiveCounter to={initial} delay={0.7} tickInterval={tickInterval} />
        {suffix}
      </div>
      <div
        className={cn(
          "mt-1 font-mono text-[11px]",
          mutedDelta ? "text-zinc-500" : "text-emerald-400/80",
        )}
      >
        {delta}
      </div>
    </motion.div>
  );
}

/**
 * 1. On reveal, counts 0 -> `to`.
 * 2. Then every `tickInterval` ms, +1 with a bump (alive feel).
 * 3. No tickInterval -> static after entrance.
 */
function LiveCounter({
  to,
  delay = 0,
  tickInterval,
}: {
  to: number;
  delay?: number;
  tickInterval?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const value = useMotionValue(0);
  const display = useTransform(value, (v) => Math.round(v).toString());
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [bumpKey, setBumpKey] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, { duration: 1.6, delay, ease: ease.out });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  useEffect(() => {
    if (!inView || !tickInterval) return;
    const id = setInterval(() => {
      animate(value, value.get() + 1, { duration: 0.5, ease: ease.out });
      setBumpKey((k) => k + 1);
    }, tickInterval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, tickInterval]);

  return (
    <motion.span
      ref={ref}
      key={bumpKey}
      animate={bumpKey > 0 ? { y: [0, -2, 0] } : {}}
      transition={{ duration: 0.4, ease: ease.out }}
      className="inline-block"
    >
      <motion.span>{display}</motion.span>
    </motion.span>
  );
}

function CategoryGrid() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06, delayChildren: 0.9 } },
      }}
      className="grid grid-cols-5 gap-3"
    >
      {CATEGORIES.map((c, i) => (
        <CategoryCard key={c.name} cat={c} index={i} />
      ))}
    </motion.div>
  );
}

function CategoryCard({
  cat,
  index,
}: {
  cat: (typeof CATEGORIES)[number];
  index: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: dur.base, ease: ease.out },
        },
      }}
      className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            {cat.abbr}
          </div>
          <div className="mt-0.5 text-[12.5px] font-medium">{cat.name}</div>
        </div>
        <div className="font-mono text-[10px] text-zinc-500">{cat.trend}</div>
      </div>
      <div className="mt-3 text-base font-semibold tabular-nums">
        <LiveCounter to={cat.initial} delay={1} />%
      </div>
      <LiveSparkline seed={index} />
    </motion.div>
  );
}

/** Sparkline redrawn every 5s — "live data feed" feel. */
function LiveSparkline({ seed }: { seed: number }) {
  const [pointsKey, setPointsKey] = useState(0);
  const [points, setPoints] = useState(() => generatePoints(seed));

  useEffect(() => {
    let counter = 0;
    const id = setInterval(() => {
      counter += 1;
      setPointsKey((k) => k + 1);
      setPoints(generatePoints(seed + counter));
    }, 5000);
    return () => clearInterval(id);
  }, [seed]);

  return (
    <svg viewBox="0 0 56 24" className="mt-2 h-5 w-full text-emerald-500/50" fill="none">
      <motion.polyline
        key={pointsKey}
        points={points}
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: ease.out }}
      />
    </svg>
  );
}

function generatePoints(seed: number): string {
  const arr: string[] = [];
  for (let i = 0; i < 8; i++) {
    const x = i * 8;
    const noise = Math.sin(seed * 11 + i * 1.7) * 6;
    const baseTrend = 18 - i * 1.4;
    const y = Math.max(2, Math.min(22, baseTrend + noise));
    arr.push(`${x},${y.toFixed(1)}`);
  }
  return arr.join(" ");
}

type StepStatus = "queued" | "running" | "done";

function RoadmapActivityLog() {
  const VISIBLE = 5;
  const idRef = useRef(VISIBLE);
  const cycleRef = useRef(0);

  const [steps, setSteps] = useState<
    Array<(typeof STEP_TEMPLATES)[number] & { id: number; status: StepStatus }>
  >(() => {
    const initial: Array<
      (typeof STEP_TEMPLATES)[number] & { id: number; status: StepStatus }
    > = [];
    for (let i = 0; i < VISIBLE; i++) {
      const tpl = STEP_TEMPLATES[i % STEP_TEMPLATES.length];
      const status: StepStatus = i < 2 ? "done" : i < 4 ? "running" : "queued";
      initial.push({ ...tpl, id: i + 1, status });
    }
    return initial;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      cycleRef.current += 1;
      setSteps(
        (
          prev,
        ): Array<(typeof STEP_TEMPLATES)[number] & { id: number; status: StepStatus }> => {
          if (prev.length === 0) return prev;
          const progressed = prev.map(
            (t): (typeof STEP_TEMPLATES)[number] & { id: number; status: StepStatus } => ({
              ...t,
              status: (t.status === "queued"
                ? "running"
                : t.status === "running"
                  ? "done"
                  : "done") as StepStatus,
            }),
          );
          const dropOldest =
            progressed[0]?.status === "done" &&
            progressed.filter((t) => t.status === "done").length > 2;
          const trimmed = dropOldest ? progressed.slice(1) : progressed;
          const tpl =
            STEP_TEMPLATES[(cycleRef.current + idRef.current) % STEP_TEMPLATES.length];
          idRef.current += 1;
          return [
            ...trimmed,
            { ...tpl, id: idRef.current, status: "queued" as StepStatus },
          ].slice(-VISIBLE);
        },
      );
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: dur.base, delay: 1.0 }}
      className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
    >
      <div className="flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
          Roadmap activity
        </div>
        <div className="flex items-center gap-1.5">
          <motion.span
            className="size-1.5 rounded-full bg-emerald-500"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="font-mono text-[10px] text-zinc-500">updating</span>
        </div>
      </div>

      <div className="mt-3 flex h-[10.5rem] flex-col gap-2 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {steps.map((step) => (
            <motion.div
              key={step.id}
              layout
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{
                opacity:
                  step.status === "queued" ? 0.55 : step.status === "running" ? 1 : 0.6,
                y: 0,
                filter: "blur(0px)",
              }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: ease.out }}
              className="flex shrink-0 items-center gap-2.5 py-1 text-[11.5px]"
            >
              <StepStatusIndicator status={step.status} />
              <div className="flex min-w-0 flex-1 items-baseline gap-2">
                <span
                  className={cn(
                    "shrink-0 font-medium",
                    step.status === "done" ? "text-zinc-400" : "text-zinc-200",
                  )}
                >
                  {step.label}
                </span>
                {step.detail && (
                  <span className="truncate font-mono text-[10.5px] text-zinc-500">
                    {step.detail}
                  </span>
                )}
              </div>
              {step.kind && (
                <span className="shrink-0 rounded-full border border-zinc-700 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                  {step.kind}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function StepStatusIndicator({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, ease: ease.out }}
        className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/90"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-2 text-zinc-950"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </motion.span>
    );
  }
  if (status === "running") {
    return (
      <span className="relative flex size-3.5 shrink-0 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full border border-emerald-300/60"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          style={{ borderTopColor: "transparent", borderRightColor: "transparent" }}
        />
        <span className="size-1 rounded-full bg-emerald-300" />
      </span>
    );
  }
  return (
    <span className="flex size-3.5 shrink-0 items-center justify-center">
      <span className="size-1.5 rounded-full bg-zinc-700" />
    </span>
  );
}
