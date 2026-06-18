import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function CTA() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div
            className="relative overflow-hidden rounded-3xl px-8 py-16 text-center lg:px-16"
            style={{
              background: [
                "radial-gradient(ellipse 80% 70% at 50% 0%, rgba(22,163,74,0.12) 0%, transparent 70%)",
                "radial-gradient(ellipse 60% 50% at 80% 80%, rgba(20,184,166,0.07) 0%, transparent 70%)",
                "#F0FDF4",
              ].join(", "),
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-3xl border border-brand/20"
            />
            <p className="text-sm font-semibold uppercase tracking-widest text-brand">
              Ready to start?
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-black leading-tight text-fg sm:text-5xl">
              Start building your roadmap today.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-lg font-medium text-fg-muted">
              Join thousands of students in Kazakhstan and beyond who are taking
              control of their academic future — one step at a time.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/auth/login"
                className="inline-flex h-13 items-center gap-2 rounded-full bg-brand px-8 text-base font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                Get started free
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            </div>

            <p className="mt-5 text-sm font-semibold text-fg-faint">
              Free to start · no application needed · no credit card required
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
