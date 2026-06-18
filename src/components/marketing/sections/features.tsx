"use client";

import { motion } from "motion/react";
import {
  CalendarClock,
  Compass,
  GraduationCap,
  LayoutList,
  Radar,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ease, dur } from "@/lib/motion/tokens";

/**
 * Features bento grid. Mirrors Seobloom's 12-col bento with per-card live
 * mini-visuals, rebuilt for Mentoria's pillars: matched catalog, roadmap,
 * courses, AI mentor, deadline reminders, streaks/progress.
 */

interface BentoCardProps {
  className?: string;
  title: string;
  body: string;
  visual?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  delay?: number;
}

export function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: dur.slow, ease: ease.out }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Features
          </p>
          <h2 className="mt-3 text-[clamp(1.75rem,1.125rem+3.125vw,3rem)] font-extrabold leading-[1.1] tracking-tight">
            Everything you&apos;d hire a counsellor for.
          </h2>
          <p className="mt-4 text-[15px] text-muted-foreground">
            Built for ambitious students in grades 8–11 who want a real plan —
            not another folder of bookmarks.
          </p>
        </motion.div>

        <div className="mt-16 grid auto-rows-fr gap-4 md:grid-cols-12">
          <BentoCard
            className="md:col-span-7"
            icon={Compass}
            title="One catalog, matched to you"
            body="We track 1,800+ olympiads, scholarships, programs, and internships — and score each against your grade, goals, and profile. You see only what fits."
            visual={<MatchedCatalogVisual />}
            delay={0}
          />
          <BentoCard
            className="md:col-span-5"
            icon={LayoutList}
            title="Your roadmap to university"
            body="A personalised, step-by-step plan — sequenced by priority and deadline, not random to-dos. It adapts as you progress."
            visual={<RoadmapMiniVisual />}
            delay={0.08}
          />

          <BentoCard
            className="md:col-span-5"
            icon={GraduationCap}
            title="Learn on your schedule"
            body="Short, structured courses in 15-minute sessions. Every course connects to an opportunity on your roadmap."
            visual={<CourseProgressVisual />}
            delay={0.16}
          />
          <BentoCard
            className="md:col-span-7"
            icon={Radar}
            title="An AI mentor that knows you"
            body="Not a generic chatbot. It has read your roadmap, tracks your progress, and gives concrete, specific guidance — 24/7."
            visual={<MentorVisual />}
            delay={0.24}
          />

          <BentoCard
            className="md:col-span-7"
            icon={CalendarClock}
            title="Never miss a deadline"
            body="Every deadline lands in your own calendar and inbox. Reminders 14 and 2 days before — so nothing slips through."
            visual={<DeadlineVisual />}
            delay={0.32}
          />
          <BentoCard
            className="md:col-span-5"
            icon={Trophy}
            title="Streaks & progress"
            body="Track real progress that motivates you to come back. Build a streak, earn XP, see how far you've come."
            visual={<StreakVisual />}
            delay={0.4}
          />
        </div>
      </div>
    </section>
  );
}

function BentoCard({ className, title, body, visual, icon: Icon, delay = 0 }: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: dur.slow, ease: ease.out, delay }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 transition-colors hover:border-foreground/30 md:p-7",
        className,
      )}
    >
      {Icon && <Icon className="h-5 w-5 text-foreground" strokeWidth={1.6} />}
      <h3 className="mt-4 text-[17px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{body}</p>
      {visual && <div className="mt-5 flex min-h-[120px] flex-1 items-end">{visual}</div>}
    </motion.div>
  );
}

/* ─── Mini-visuals ─── */

function MatchedCatalogVisual() {
  const rows = [
    { name: "NIS Olympiad — Physics", match: 91 },
    { name: "Bolashak Scholarship", match: 78 },
    { name: "MIT Science Award", match: 84 },
  ];
  return (
    <div className="w-full space-y-2">
      {rows.map((r, i) => (
        <motion.div
          key={r.name}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: dur.base, delay: i * 0.1, ease: ease.out }}
          className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2"
        >
          <span className="truncate text-[12px] font-medium">{r.name}</span>
          <span className="ml-2 shrink-0 font-mono text-[11px] tabular-nums text-brand">
            {r.match}% match
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function RoadmapMiniVisual() {
  return (
    <div className="w-full space-y-1.5">
      {[true, true, false, false].map((done, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: dur.fast, delay: i * 0.08, ease: ease.out }}
          className="flex items-center gap-2"
        >
          <span
            className={cn(
              "size-4 shrink-0 rounded-full",
              done ? "bg-brand" : "border border-border bg-background",
            )}
          />
          <span className="h-1.5 flex-1 rounded-full bg-muted">
            <span
              className={cn("block h-full rounded-full", done ? "bg-brand/40" : "bg-transparent")}
              style={{ width: done ? "100%" : "0%" }}
            />
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function CourseProgressVisual() {
  const courses = [
    { name: "Research Writing", pct: 67 },
    { name: "Financial Literacy", pct: 25 },
  ];
  return (
    <div className="w-full space-y-3">
      {courses.map((c, i) => (
        <motion.div
          key={c.name}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: dur.base, delay: i * 0.12, ease: ease.out }}
        >
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium">{c.name}</span>
            <span className="font-mono tabular-nums text-muted-foreground">{c.pct}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: "0%" }}
              whileInView={{ width: `${c.pct}%` }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1, delay: 0.2 + i * 0.12, ease: ease.out }}
              className="h-full rounded-full bg-foreground"
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MentorVisual() {
  return (
    <div className="w-full space-y-2">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: dur.base, ease: ease.out }}
        className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-brand px-3 py-2 text-[11.5px] text-white"
      >
        What should I focus on this month?
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: dur.base, delay: 0.25, ease: ease.out }}
        className="max-w-[88%] rounded-2xl rounded-bl-sm border border-border bg-muted/30 px-3 py-2 text-[11.5px] text-foreground/85"
      >
        Finish the Research Writing course — it directly lifts your Science
        score. You have 18 days before the NIS application opens.
      </motion.div>
    </div>
  );
}

function DeadlineVisual() {
  const items = [
    { name: "STEM Olympiad", days: "2 days" },
    { name: "NIS Scholarship", days: "28 days" },
  ];
  return (
    <div className="grid w-full grid-cols-2 gap-3">
      {items.map((it, i) => (
        <motion.div
          key={it.name}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: dur.base, delay: i * 0.1, ease: ease.out }}
          className="rounded-lg border border-border bg-muted/20 p-3"
        >
          <CalendarClock className="size-4 text-foreground/70" strokeWidth={1.6} />
          <div className="mt-2 text-[12px] font-medium">{it.name}</div>
          <div
            className={cn(
              "mt-0.5 font-mono text-[10.5px]",
              i === 0 ? "text-brand" : "text-muted-foreground",
            )}
          >
            in {it.days}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function StreakVisual() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5">
        {days.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: dur.fast, delay: i * 0.05, ease: ease.out }}
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-[10px] font-semibold",
              i < 5 ? "bg-brand text-white" : "border border-border text-muted-foreground",
            )}
          >
            {d}
          </motion.div>
        ))}
      </div>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        12-day streak · keep it up
      </p>
    </div>
  );
}
