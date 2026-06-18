import Link from "next/link";
import { BarChart3, Shield, Users } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

const PILLARS = [
  {
    icon: Users,
    title: "Scale your mentoring",
    description:
      "Support dozens of students with consistent, data-driven guidance — without burning out. Mentoria handles the catalogue; you handle the relationship.",
    color: "#1E40AF",
    bg: "#E3EDFB",
  },
  {
    icon: BarChart3,
    title: "Real data for schools",
    description:
      "Track student engagement, opportunity applications, and course completions. Give sponsors and administrators a clear picture of student progress.",
    color: "#0F766E",
    bg: "#D7F5F0",
  },
  {
    icon: Shield,
    title: "Built for institutional trust",
    description:
      "SOC 2-grade security, privacy-by-design for minors, and transparent data practices. Safe for schools, reassuring for parents.",
    color: "#7E22CE",
    bg: "#F6E9FF",
  },
];

export function ForMentors() {
  return (
    <section id="mentors" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-fg px-8 py-16 lg:px-16">
          <ScrollReveal className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-ring">
              For schools &amp; mentors
            </p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Turn mentoring into a programme, not a conversation.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-white/70">
              Mentoria Hub gives schools, counsellors, and career mentors the
              infrastructure to guide students at scale — with real outcomes and
              real data to show for it.
            </p>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {PILLARS.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 0.1}>
                <div className="rounded-2xl bg-white/5 p-6">
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: p.bg }}
                  >
                    <p.icon className="h-5 w-5" style={{ color: p.color }} />
                  </div>
                  <h3 className="text-base font-black text-white">{p.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-white/65">
                    {p.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className="mt-10 text-center">
            <Link
              href="/auth/login"
              className="inline-flex h-12 items-center rounded-full border border-white/20 bg-white/10 px-7 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              For schools &amp; mentors →
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
