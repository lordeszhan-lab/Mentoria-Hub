import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

const FREE_FEATURES = [
  "Full access to the opportunity catalog",
  "One personal roadmap",
  "AI Mentor (20 questions / month)",
  "Access to 10 foundation courses",
  "Deadline reminders",
  "No credit card required",
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-surface-2 py-24 lg:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-black text-fg sm:text-4xl">
            Free to start. No surprises.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg font-medium text-fg-muted">
            Every student gets a full, working roadmap for free. Extended plans
            for schools and programmes are available on request.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {/* Free card */}
          <ScrollReveal delay={0.05}>
            <div className="flex flex-col rounded-2xl border-2 border-brand bg-surface p-8 shadow-card-hover">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand">
                    For students
                  </p>
                  <p className="mt-1 text-3xl font-black text-fg">Free</p>
                  <p className="text-sm font-medium text-fg-muted">Always</p>
                </div>
                <span className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand">
                  Start today
                </span>
              </div>

              <ul className="mb-8 flex flex-col gap-3">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span className="text-sm font-semibold text-fg">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/login"
                className="mt-auto flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-bold text-white transition-all hover:-translate-y-px hover:bg-brand-strong hover:shadow-md"
              >
                Get started free — no application needed
              </Link>
            </div>
          </ScrollReveal>

          {/* Schools card */}
          <ScrollReveal delay={0.12}>
            <div className="flex flex-col rounded-2xl border border-border bg-surface p-8">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-fg-muted">
                  For schools &amp; programmes
                </p>
                <p className="mt-1 text-3xl font-black text-fg">Custom</p>
                <p className="text-sm font-medium text-fg-muted">Pricing on request</p>
              </div>

              <ul className="mb-8 flex flex-col gap-3">
                {[
                  "Everything in Free, for all students",
                  "School-wide dashboard & reporting",
                  "Unlimited AI Mentor interactions",
                  "Custom opportunity catalog curation",
                  "Dedicated onboarding & support",
                  "Data exports & sponsor reporting",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-fg-faint" />
                    <span className="text-sm font-semibold text-fg-muted">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/login"
                className="mt-auto flex h-12 w-full items-center justify-center rounded-full border border-border text-sm font-bold text-fg transition-all hover:bg-surface-2"
              >
                Contact us for schools →
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
