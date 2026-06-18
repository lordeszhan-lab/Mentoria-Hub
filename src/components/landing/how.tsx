import { ScrollReveal } from "./scroll-reveal";

const STEPS = [
  {
    number: "01",
    color: "#16A34A",
    bg: "#DCFCE7",
    title: "Tell us your goal",
    description:
      "Answer a short set of questions: your grade, interests, dream university or career, and current strengths. It takes less than 5 minutes.",
  },
  {
    number: "02",
    color: "#1CB0F6",
    bg: "#E0F4FE",
    title: "Get your personal roadmap",
    description:
      "Mentoria generates a prioritised plan — the right opportunities, courses, and actions — sequenced by deadline and impact for your specific goals.",
  },
  {
    number: "03",
    color: "#FF9600",
    bg: "#FFF1E0",
    title: "Follow it, step by step",
    description:
      "Each step links directly to an application, a course, or an action you can take today. Your mentor guides you, your progress is tracked automatically.",
  },
];

export function How() {
  return (
    <section id="how" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-black text-fg sm:text-4xl">
            From goal to plan in minutes.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg font-medium text-fg-muted">
            No consultants, no waiting lists, no application required to start.
          </p>
        </ScrollReveal>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 0.1}>
              <div className="relative rounded-2xl border border-border bg-surface p-8 shadow-card">
                {/* Connector line (desktop) */}
                {i < STEPS.length - 1 && (
                  <div className="absolute -right-4 top-10 hidden h-0.5 w-8 bg-border sm:block" />
                )}
                <div
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black"
                  style={{ background: step.bg, color: step.color }}
                >
                  {step.number}
                </div>
                <h3 className="mt-5 text-xl font-black text-fg">{step.title}</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-fg-muted">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
