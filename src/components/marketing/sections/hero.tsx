"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck, Globe, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ease, dur } from "@/lib/motion/tokens";
import { HeroHeadline } from "@/components/marketing/hero/hero-headline";
import { NounCycler } from "@/components/primitives/noun-cycler";
import { SubtleMagnetic } from "@/components/primitives/subtle-magnetic";

const GOAL_WORDS = ["a top university", "Nazarbayev University", "MIT", "Bolashak", "your dream school"];

const TRUST = [
  { icon: Globe, label: "Built for KZ + international students" },
  { icon: ShieldCheck, label: "SOC 2-grade security" },
  { icon: BadgeCheck, label: "Free to start" },
];

export function HeroSection() {
  return (
    <section className="hero relative isolate overflow-hidden px-6 pb-32 pt-16 md:pb-40 md:pt-24">
      {/* Soft glow behind the top of the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px]"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, var(--color-brand-soft) 0%, transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-5xl">
        {/* Eyebrow pill */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.base, ease: ease.out, delay: 0.05 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-sm">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
            </span>
            Your academic navigator · Grades 8–11
          </div>
        </motion.div>

        {/* Headline — *words* render in brand green */}
        <div className="mt-6 text-center">
          <HeroHeadline text="Find every opportunity. *Build* *your* *roadmap.* Get into your dream university." />
        </div>

        {/* Subhead with cycling goal */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.slow, ease: ease.out, delay: 0.55 }}
          className="mx-auto mt-6 max-w-2xl text-balance text-center text-[clamp(1.05rem,1rem+0.4vw,1.25rem)] leading-relaxed text-muted-foreground"
        >
          Mentoria Hub turns scattered olympiads, scholarships, and courses into
          one personal plan to{" "}
          <span className="font-mono text-[0.92em] text-foreground">
            <NounCycler words={GOAL_WORDS} intervalMs={2400} />
          </span>{" "}
          — guided by an AI mentor that knows where you&apos;re headed.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.slow, ease: ease.out, delay: 0.7 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15, ease: ease.out }}
          >
            <Link
              href="/auth/login?mode=signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "weight-shift h-11 gap-2 px-7 text-[14px] font-medium",
              )}
            >
              Start free — no application needed
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <SubtleMagnetic>
            <Link
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 px-7 text-[14px] font-medium",
              )}
            >
              See how it works
            </Link>
          </SubtleMagnetic>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: dur.slow, ease: ease.out, delay: 0.9 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {TRUST.map((t) => (
            <span
              key={t.label}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground"
            >
              <t.icon className="size-3.5 text-brand" strokeWidth={2} />
              {t.label}
            </span>
          ))}
        </motion.div>
      </div>

    </section>
  );
}
