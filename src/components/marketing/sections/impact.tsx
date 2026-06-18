"use client";

import { motion, useInView, animate, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { Users, BookOpen, Map, GraduationCap, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { ease, dur } from "@/lib/motion/tokens";

/**
 * "By the numbers" impact section. Mirrors the structure of Seobloom's
 * ai-engines section (a clean bordered list of rows with an icon, label, note,
 * and a right-aligned figure), rebuilt with Mentoria's impact stats and a
 * count-up on each figure.
 */

const STATS = [
  {
    icon: Users,
    value: 4200,
    suffix: "+",
    label: "Students exploring",
    note: "Building a generation of prepared students across grades 8–11.",
  },
  {
    icon: BookOpen,
    value: 1800,
    suffix: "+",
    label: "Opportunities catalogued",
    note: "Olympiads, scholarships, programs, internships — scored to your profile.",
  },
  {
    icon: Map,
    value: 340,
    suffix: "+",
    label: "Roadmaps generated",
    note: "Personalised, sequenced plans across grades 8–11.",
  },
  {
    icon: GraduationCap,
    value: 60,
    suffix: "+",
    label: "Courses available",
    note: "Short, structured, and tied to the opportunities on your roadmap.",
  },
  {
    icon: Globe,
    value: 12,
    suffix: "+",
    label: "Countries supported",
    note: "KZ, RU, UZ, TR, and international students welcome.",
  },
];

export function ImpactSection() {
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
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            By the numbers
          </p>
          <h2 className="mt-3 text-[clamp(1.75rem,1.125rem+3.125vw,3rem)] font-extrabold leading-[1.1] tracking-tight">
            Built to make a real difference.
          </h2>
        </motion.div>

        <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-border bg-background">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: dur.base, ease: ease.out, delay: i * 0.06 }}
              className={cn(
                "grid grid-cols-[64px_1fr_auto] items-center gap-4 px-5 py-5 md:px-7 md:py-6",
                i !== 0 && "border-t border-border",
              )}
            >
              <span className="flex size-12 items-center justify-center rounded-lg bg-muted/40 text-foreground">
                <s.icon className="size-5" strokeWidth={1.7} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold tracking-tight">{s.label}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">{s.note}</p>
              </div>
              <div className="text-right">
                <div className="font-mono text-[24px] font-extrabold tabular-nums text-brand">
                  <CountUp to={s.value} />
                  {s.suffix}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-[12px] text-muted-foreground">
          Figures reflect platform activity to date.
        </p>
      </div>
    </section>
  );
}

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const value = useMotionValue(0);
  const display = useTransform(value, (v) =>
    Math.round(v).toLocaleString("en-US"),
  );
  const inView = useInView(ref, { once: true, margin: "-10%" });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, { duration: 1.6, ease: ease.out });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <span ref={ref}>
      <motion.span>{display}</motion.span>
    </span>
  );
}
