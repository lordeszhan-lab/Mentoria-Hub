"use client";

import Link from "next/link";
import { ArrowRight, Flame, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { BrowserFrame } from "./browser-frame";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.6,
    delay,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
});

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Restrained gradient mesh — hero only */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: [
            "radial-gradient(ellipse 90% 70% at 80% 30%, rgba(22,163,74,0.07) 0%, transparent 65%)",
            "radial-gradient(ellipse 70% 60% at 20% 70%, rgba(20,184,166,0.05) 0%, transparent 65%)",
            "radial-gradient(ellipse 60% 50% at 50% 90%, rgba(28,176,246,0.04) 0%, transparent 60%)",
            "#F6F8F7",
          ].join(", "),
        }}
      />

      <div className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-36 lg:pb-28">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-16">
          {/* ── Text column (40%) ── */}
          <div className="w-full lg:w-[42%] lg:pt-6">
            {/* Eyebrow pill */}
            <motion.div {...fadeUp(0)}>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-1.5 text-sm font-semibold text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Your academic navigator, grades 8–11
              </span>
            </motion.div>

            {/* Headline — h1, LCP element */}
            <motion.h1
              {...fadeUp(0.08)}
              className="mt-5 text-[2.6rem] font-black leading-[1.08] tracking-tight text-fg sm:text-5xl lg:text-[3.25rem]"
            >
              Find every opportunity.{" "}
              <span className="text-brand">Build your roadmap.</span>{" "}
              Get into your dream university.
            </motion.h1>

            {/* Subhead */}
            <motion.p
              {...fadeUp(0.15)}
              className="mt-5 max-w-md text-lg font-medium leading-relaxed text-fg-muted"
            >
              Mentoria Hub turns scattered olympiads, scholarships, and courses
              into one personal plan — with an AI mentor that knows where
              you&apos;re headed.
            </motion.p>

            {/* CTA row */}
            <motion.div
              {...fadeUp(0.22)}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/auth/login"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                Start free — no application needed
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex h-12 items-center gap-1.5 rounded-full border border-border px-6 text-sm font-semibold text-fg-muted transition-all hover:border-fg/30 hover:text-fg"
              >
                See how it works
              </a>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              {...fadeUp(0.3)}
              className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2"
            >
              {[
                "Built for KZ + international students",
                "SOC 2-grade security",
                "Free to start",
              ].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1.5 text-xs font-semibold text-fg-faint"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>

          {/* ── Visual column (60%) ── */}
          <motion.div
            {...fadeUp(0.2)}
            className="relative w-full lg:w-[58%]"
          >
            <BrowserFrame className="w-full">
              <RoadmapMock />
            </BrowserFrame>

            {/* Floating accent chip 1 — match score ring */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-4 top-1/4 rounded-2xl border border-border bg-surface p-3 shadow-pop"
              aria-hidden
            >
              <div className="flex items-center gap-2">
                <MatchRing pct={87} />
                <div>
                  <p className="text-xs font-bold text-fg">87% match</p>
                  <p className="text-[10px] text-fg-faint">NIS Olympiad</p>
                </div>
              </div>
            </motion.div>

            {/* Floating accent chip 2 — streak */}
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.2,
              }}
              className="absolute -right-3 bottom-16 rounded-2xl border border-border bg-surface p-3 shadow-pop"
              aria-hidden
            >
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-accent-orange" />
                <div>
                  <p className="text-xs font-bold text-fg">12-day streak</p>
                  <p className="text-[10px] text-fg-faint">Keep it up! 🔥</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ── Inline product mock: Roadmap screen ── */
function RoadmapMock() {
  const steps = [
    {
      status: "done",
      label: "STEM Olympiad Kazakhstan",
      kind: "Opportunity",
      deadline: "Oct 12",
      color: "#1CB0F6",
      chipBg: "#E0F4FE",
    },
    {
      status: "in_progress",
      label: "Build your research project",
      kind: "Course",
      deadline: "Nov 30",
      color: "#FF9600",
      chipBg: "#FFF1E0",
    },
    {
      status: "available",
      label: "NIS Scholarship Application",
      kind: "Opportunity",
      deadline: "Jan 15",
      color: "#16A34A",
      chipBg: "#DCFCE7",
    },
    {
      status: "locked",
      label: "University Essay Workshop",
      kind: "Course",
      deadline: "Mar 1",
      color: "#CE82FF",
      chipBg: "#F6E9FF",
    },
  ];

  return (
    <div className="bg-canvas p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-faint">
            My Roadmap
          </p>
          <p className="text-sm font-bold text-fg">Grade 10 — Spring 2026</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-brand" />
          <span className="text-xs font-semibold text-brand">3 active</span>
        </div>
      </div>

      {/* Steps */}
      <div className="relative flex flex-col gap-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex gap-3">
            {/* Rail */}
            <div className="flex flex-col items-center">
              <div
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                  step.status === "done"
                    ? "border-brand bg-brand text-white"
                    : step.status === "in_progress"
                      ? "border-accent-orange bg-accent-orange text-white"
                      : step.status === "available"
                        ? "border-brand-ring bg-surface text-brand"
                        : "border-border bg-surface-2 text-fg-faint"
                }`}
              >
                {step.status === "done" ? "✓" : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-0.5 flex-1 my-0.5 ${step.status === "done" ? "bg-brand" : "bg-border"}`}
                  style={{ minHeight: 28 }}
                />
              )}
            </div>

            {/* Card */}
            <div
              className={`mb-2 flex-1 rounded-xl border p-3 ${
                step.status === "locked"
                  ? "border-border bg-surface opacity-50"
                  : "border-border bg-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-fg">
                    {step.label}
                  </p>
                  <p className="text-[10px] text-fg-faint">Due {step.deadline}</p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: step.chipBg, color: step.color }}
                >
                  {step.kind}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full w-1/2 rounded-full bg-brand" />
        </div>
        <span className="text-[10px] font-semibold text-fg-muted">50% complete</span>
      </div>
    </div>
  );
}

/* ── SVG progress ring ── */
function MatchRing({ pct }: { pct: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" className="-rotate-90">
      <circle cx={18} cy={18} r={r} fill="none" stroke="#E8ECEA" strokeWidth={3} />
      <circle
        cx={18}
        cy={18}
        r={r}
        fill="none"
        stroke="#16A34A"
        strokeWidth={3}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}
