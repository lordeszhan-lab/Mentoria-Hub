"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ease, dur } from "@/lib/motion/tokens";

/**
 * Final CTA. Mirrors Seobloom's CTA section: dotted radial background, a
 * soft brand glow, a blur-in headline, primary + secondary CTAs, and a
 * mono reassurance line.
 */
export function CtaSection() {
  return (
    <section className="relative isolate overflow-hidden px-6 py-32 md:py-40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, var(--color-fg-muted) 0.5px, transparent 0.5px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 60% 50% at center, black 0%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 50% at center, black 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at center, var(--color-brand-soft) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-3xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: dur.hero, ease: ease.out }}
          className="pb-[0.1em] text-[clamp(2.25rem,1.5rem+3.5vw,4rem)] font-extrabold leading-[1.1] tracking-tight"
        >
          Start building your <span className="text-brand">roadmap</span> today.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: dur.slow, ease: ease.out, delay: 0.15 }}
          className="mx-auto mt-6 max-w-xl text-balance text-[16px] leading-relaxed text-muted-foreground md:text-[17px]"
        >
          Join thousands of students in Kazakhstan and beyond taking control of
          their academic future — one step at a time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: dur.slow, ease: ease.out, delay: 0.3 }}
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
                "weight-shift h-12 gap-2 px-8 text-[15px] font-medium",
              )}
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15, ease: ease.out }}
          >
            <Link
              href="/auth/login?mode=signin"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 px-7 text-[15px] font-medium",
              )}
            >
              Log in
            </Link>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: dur.slow, ease: ease.out, delay: 0.5 }}
          className="mt-7 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
        >
          Free to start · no application needed · no credit card required
        </motion.p>
      </div>
    </section>
  );
}
