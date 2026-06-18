"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ease, dur } from "@/lib/motion/tokens";
import { SubtleMagnetic } from "@/components/primitives/subtle-magnetic";

/**
 * Pricing preview. Mirrors Seobloom's pricing-card visual language (rounded-2xl,
 * "Most popular" ring, mono price, check rows) but uses Mentoria's two-tier
 * model from the PDF: Free (for students) and Custom (for schools & programmes).
 * No invented numeric prices.
 */

const TIERS = [
  {
    id: "free",
    name: "Free",
    priceLabel: "Always",
    description: "For students",
    cta: "Start today",
    popular: true,
    features: [
      "Full access to the opportunity catalog",
      "One personal roadmap",
      "AI Mentor (20 questions / month)",
      "Access to 10 foundation courses",
      "Deadline reminders",
      "No credit card required",
    ],
  },
  {
    id: "custom",
    name: "Custom",
    priceLabel: "Pricing on request",
    description: "For schools & programmes",
    cta: "Contact us",
    popular: false,
    features: [
      "Everything in Free, for all students",
      "School-wide dashboard & reporting",
      "Unlimited AI Mentor interactions",
      "Custom opportunity catalog curation",
      "Dedicated onboarding & support",
      "Data exports & sponsor reporting",
    ],
  },
];

export function PricingPreviewSection() {
  return (
    <section id="pricing" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: dur.slow, ease: ease.out }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Pricing
          </p>
          <h2 className="mt-3 text-[clamp(1.75rem,1.125rem+3.125vw,3rem)] font-extrabold leading-[1.1] tracking-tight">
            Free to start. No surprises.
          </h2>
          <p className="mt-4 text-[15px] text-muted-foreground">
            Every student gets a full, working roadmap for free. Extended plans
            for schools and programmes are available on request.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: dur.slow, ease: ease.out, delay: i * 0.08 }}
              className={cn(
                "relative flex flex-col rounded-2xl bg-background p-6 md:p-7",
                tier.popular ? "shadow-lg ring-2 ring-brand" : "border border-border",
              )}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-6">
                  <div className="rounded-full bg-brand px-3 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white">
                    For students
                  </div>
                </div>
              )}

              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {tier.description}
                </p>
                <h3 className="mt-2 text-[28px] font-extrabold tracking-tight">{tier.name}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">{tier.priceLabel}</p>
              </div>

              <ul className="mt-7 flex-1 space-y-2.5 text-[13.5px]">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-brand">
                      <Check className="size-2.5 text-white" strokeWidth={3} />
                    </span>
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  href={
                    tier.id === "free"
                      ? "/auth/login?mode=signup"
                      : "mailto:hello@mentoriahub.kz"
                  }
                  className={cn(
                    buttonVariants({
                      variant: tier.popular ? "default" : "outline",
                      size: "lg",
                    }),
                    "h-11 w-full text-[14px] font-medium",
                    tier.popular && "weight-shift",
                  )}
                >
                  {tier.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center text-[12.5px] text-muted-foreground">
          Running a school or programme?{" "}
          <SubtleMagnetic>
            <a
              href="mailto:hello@mentoriahub.kz"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Talk to us
            </a>
          </SubtleMagnetic>{" "}
          about custom catalog curation, dashboards, and sponsor reporting.
        </p>
      </div>
    </section>
  );
}
