import { ScrollReveal } from "./scroll-reveal";

const PAIN_POINTS = [
  {
    emoji: "📋",
    text: "Hundreds of olympiads and scholarships — but which ones are worth your time?",
  },
  {
    emoji: "⏰",
    text: "Deadlines buried in Telegram groups, school boards, and random emails.",
  },
  {
    emoji: "🗺️",
    text: "No clear map from where you are now to where you want to go.",
  },
];

export function Problem() {
  return (
    <section
      id="students"
      className="bg-surface-2 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <ScrollReveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">
            The problem
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-fg sm:text-4xl">
            The path to your dream university is real — it&apos;s just scattered everywhere.
          </h2>
          <p className="mt-4 text-lg font-medium text-fg-muted">
            Every year, students miss the exact opportunities that would have made
            the difference. Not because they aren&apos;t capable — because no one showed
            them where to look or what to do next.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {PAIN_POINTS.map((pt, i) => (
            <ScrollReveal key={pt.text} delay={i * 0.08}>
              <div className="rounded-2xl border border-border bg-surface p-5 text-left shadow-card">
                <span className="text-2xl">{pt.emoji}</span>
                <p className="mt-3 text-sm font-semibold leading-snug text-fg">
                  {pt.text}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
