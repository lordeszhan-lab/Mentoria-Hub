"use client";

import { motion } from "motion/react";
import { ease, dur } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

/**
 * "How it works" — mirrors Seobloom's 3-step alternating layout, each step
 * paired with a bespoke live mini-visual. Rebuilt for Mentoria's core loop:
 *   01 Tell us your goal  02 Get your personal roadmap  03 Follow it, step by step
 */

const STEPS = [
  {
    id: 1,
    eyebrow: "Step 01",
    title: "Tell us your goal",
    body: "Answer a short set of questions — your grade, interests, dream university or career, and current strengths. It takes less than 5 minutes, no application required.",
  },
  {
    id: 2,
    eyebrow: "Step 02",
    title: "Get your personal roadmap",
    body: "Mentoria generates a prioritised plan — the right opportunities, courses, and actions — sequenced by deadline and impact for your specific goals.",
  },
  {
    id: 3,
    eyebrow: "Step 03",
    title: "Follow it, step by step",
    body: "Each step links directly to an application, a course, or an action you can take today. Your AI mentor guides you; your progress is tracked automatically.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-t bg-muted/10 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: dur.slow, ease: ease.out }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            How it works
          </p>
          <h2 className="mt-3 text-[clamp(1.75rem,1.125rem+3.125vw,3rem)] font-extrabold leading-[1.1] tracking-tight">
            From goal to plan in minutes.
          </h2>
          <p className="mt-4 text-[15px] text-muted-foreground">
            No consultants, no waiting lists, no application required to start.
          </p>
        </motion.div>

        <div className="mt-20 space-y-24 md:space-y-32">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: dur.slow, ease: ease.out, delay: 0.05 }}
              className={cn(
                "grid items-center gap-10 md:grid-cols-2 md:gap-16",
                i % 2 === 1 && "md:[&>div:first-child]:order-2",
              )}
            >
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {step.eyebrow}
                </p>
                <h3 className="mt-3 text-[clamp(1.75rem,1.25rem+2vw,2.5rem)] font-extrabold leading-[1.1] tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
              <StepVisual stepId={step.id} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepVisual({ stepId }: { stepId: number }) {
  if (stepId === 1) return <GoalVisual />;
  if (stepId === 2) return <RoadmapVisual />;
  return <FollowVisual />;
}

/* Step 01 — goal intake: grade pills + interest chips */
function GoalVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: dur.slow, ease: ease.out, delay: 0.15 }}
      className="rounded-2xl border border-border bg-background p-6 shadow-lg"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        Your goal
      </p>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <span className="font-mono text-[13px] text-muted-foreground">I want to</span>
        <span className="font-mono text-[15px] text-foreground">study CS at a top university</span>
      </div>
      <div className="mt-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Grade
        </p>
        <div className="mt-2 flex gap-1.5">
          {[8, 9, 10, 11].map((g) => (
            <span
              key={g}
              className={cn(
                "flex size-9 items-center justify-center rounded-full border text-[13px] font-semibold",
                g === 10
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-muted/40 text-foreground/70",
              )}
            >
              {g}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Interests
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["STEM", "Programming", "Science"].map((c, i) => (
            <motion.span
              key={c}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: dur.fast, delay: 0.25 + i * 0.06, ease: ease.out }}
              className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 font-mono text-[11px] text-foreground/80"
            >
              {c}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* Step 02 — roadmap generates: a vertical step list draws in */
function RoadmapVisual() {
  const steps = [
    { label: "STEM Olympiad Kazakhstan", kind: "Opportunity", done: true },
    { label: "Research Writing course", kind: "Course", done: true },
    { label: "NIS Scholarship Application", kind: "Opportunity", done: false },
    { label: "University Essay Workshop", kind: "Course", done: false },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: dur.slow, ease: ease.out, delay: 0.15 }}
      className="rounded-2xl border border-border bg-background p-5 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Your roadmap · Grade 10
        </p>
        <span className="font-mono text-[10px] text-brand">generating</span>
      </div>
      <div className="mt-4 space-y-2.5">
        {steps.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: 8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: dur.base, delay: 0.25 + i * 0.12, ease: ease.out }}
            className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5"
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                s.done ? "bg-brand text-white" : "border border-border text-muted-foreground",
              )}
            >
              {s.done ? "✓" : i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{s.label}</span>
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
              {s.kind}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* Step 03 — follow it: next-move card + progress */
function FollowVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: dur.slow, ease: ease.out, delay: 0.15 }}
      className="space-y-3"
    >
      <div className="rounded-2xl border border-brand/40 bg-background p-5 shadow-lg">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand">
          Next move
        </p>
        <div className="mt-1 text-[16px] font-semibold tracking-tight">
          NIS Scholarship Application
        </div>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          Deadline Nov 30 · 28 days left
        </p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: "0%" }}
            whileInView={{ width: "40%" }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1.1, ease: ease.out, delay: 0.3 }}
            className="h-full rounded-full bg-brand"
          />
        </div>
        <p className="mt-1.5 font-mono text-[10.5px] text-muted-foreground">40% complete</p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: dur.base, delay: 0.7, ease: ease.out }}
        className="flex items-center gap-2.5 rounded-xl border border-border bg-background p-3.5"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-brand font-mono text-[11px] text-white">
          ✓
        </span>
        <div className="flex-1">
          <p className="text-[12.5px] font-medium">Step completed</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            +25 XP · 12-day streak kept
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
