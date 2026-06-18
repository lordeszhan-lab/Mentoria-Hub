import { CountUp } from "./count-up";
import { ScrollReveal } from "./scroll-reveal";

const STATS = [
  {
    value: 1800,
    suffix: "+",
    label: "Opportunities catalogued",
    sub: "Olympiads, scholarships, programs, internships",
    color: "#1CB0F6",
    bg: "#E0F4FE",
  },
  {
    value: 340,
    suffix: "+",
    label: "Roadmaps generated",
    sub: "Personalised plans across grades 8–11",
    color: "#16A34A",
    bg: "#DCFCE7",
  },
  {
    value: 60,
    suffix: "+",
    label: "Courses available",
    sub: "Built for competitive applicants",
    color: "#FF9600",
    bg: "#FFF1E0",
  },
  {
    value: 12,
    suffix: "+",
    label: "Countries supported",
    sub: "KZ, RU, UZ, TR, and international",
    color: "#CE82FF",
    bg: "#F6E9FF",
  },
];

export function Proof() {
  return (
    <section className="bg-surface-2 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">
            By the numbers
          </p>
          <h2 className="mt-3 text-3xl font-black text-fg sm:text-4xl">
            Built to make a real difference.
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.08}>
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-xl font-black"
                  style={{ background: stat.bg, color: stat.color }}
                >
                  #
                </div>
                <p
                  className="text-4xl font-black tabular-nums"
                  style={{ color: stat.color }}
                >
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1.5 text-base font-black text-fg">{stat.label}</p>
                <p className="mt-1 text-xs font-medium text-fg-muted">{stat.sub}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
