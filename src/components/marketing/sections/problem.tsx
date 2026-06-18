"use client";

import { motion } from "motion/react";
import { ClipboardList, AlarmClock, Map } from "lucide-react";
import { ease, dur } from "@/lib/motion/tokens";

/**
 * Problem section (PDF page 2). Empathetic framing of the student's pain, then
 * three pain cards. Same monochrome card language as the rest of the page.
 */

const PAINS = [
  {
    icon: ClipboardList,
    body: "Hundreds of olympiads and scholarships — but which ones are actually worth your time?",
  },
  {
    icon: AlarmClock,
    body: "Deadlines buried in Telegram groups, school boards, and random emails.",
  },
  {
    icon: Map,
    body: "No clear map from where you are now to where you want to go.",
  },
];

export function ProblemSection() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: dur.slow, ease: ease.out }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand">
            The problem
          </p>
          <h2 className="mt-3 text-[clamp(1.75rem,1.125rem+3.125vw,3rem)] font-extrabold leading-[1.1] tracking-tight">
            The path to your dream university is real — it&apos;s just scattered
            everywhere.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Every year, students miss the exact opportunities that would have
            made the difference. Not because they aren&apos;t capable — because
            no one showed them where to look or what to do next.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {PAINS.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: dur.base, ease: ease.out, delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-background p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted/40 text-foreground">
                <p.icon className="size-5" strokeWidth={1.7} />
              </span>
              <p className="mt-4 text-[14px] leading-relaxed text-foreground/85">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
