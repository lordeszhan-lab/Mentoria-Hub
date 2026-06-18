"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Users, BarChart3, ShieldCheck } from "lucide-react";
import { ease, dur } from "@/lib/motion/tokens";

/**
 * "For schools & mentors" — the institutional-credibility band. Mirrors the
 * dark inverted section from the PDF (page 9). Dark surface, green accent on
 * the eyebrow + icons, three value cards, one CTA. This is what makes the page
 * credible to a sponsor or school, not just a student.
 */

const CARDS = [
  {
    icon: Users,
    title: "Scale your mentoring",
    body: "Support dozens of students with consistent, data-driven guidance — without burning out. Mentoria handles the catalogue; you handle the relationship.",
  },
  {
    icon: BarChart3,
    title: "Real data for schools",
    body: "Track student engagement, opportunity applications, and course completions. Give sponsors and administrators a clear picture of student progress.",
  },
  {
    icon: ShieldCheck,
    title: "Built for institutional trust",
    body: "SOC 2-grade security, privacy-by-design for minors, and transparent data practices. Safe for schools, reassuring for parents.",
  },
];

export function ForSchoolsSection() {
  return (
    <section className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] bg-zinc-950 px-6 py-16 text-zinc-100 md:px-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: dur.slow, ease: ease.out }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand">
              For schools & mentors
            </p>
            <h2 className="mt-3 text-[clamp(1.75rem,1.125rem+3.125vw,3rem)] font-extrabold leading-[1.1] tracking-tight">
              Turn mentoring into a programme, not a conversation.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-zinc-400">
              Mentoria Hub gives schools, counsellors, and career mentors the
              infrastructure to guide students at scale — with real outcomes and
              real data to show for it.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {CARDS.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: dur.base, ease: ease.out, delay: i * 0.08 }}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-zinc-800">
                  <c.icon className="size-4 text-brand" strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 text-[16px] font-semibold tracking-tight">{c.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{c.body}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: dur.slow, ease: ease.out, delay: 0.3 }}
            className="mt-12 flex justify-center"
          >
            <Link
              href="mailto:hello@mentoriahub.kz"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-700 px-6 text-[14px] font-medium text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
            >
              For schools & mentors
              <ArrowRight className="size-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
