import { BookOpen, Flame } from "lucide-react";
import { BrowserFrame } from "./browser-frame";
import { ScrollReveal } from "./scroll-reveal";

const COURSES = [
  {
    title: "Research Writing for Science Olympiads",
    category: "STEM",
    catColor: "#1E40AF",
    catBg: "#E3EDFB",
    lessons: 12,
    pct: 67,
    ringColor: "#2B70C9",
  },
  {
    title: "Financial Literacy & Entrepreneurship",
    category: "Finance",
    catColor: "#A16207",
    catBg: "#FFF6D6",
    lessons: 8,
    pct: 25,
    ringColor: "#FFC800",
  },
  {
    title: "University Application Essentials",
    category: "Business",
    catColor: "#C2410C",
    catBg: "#FFF1E0",
    lessons: 10,
    pct: 0,
    ringColor: "#FF9600",
  },
];

function ProgressRing({ pct, color, size = 36 }: { pct: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8ECEA" strokeWidth={3} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round"
      />
    </svg>
  );
}

function CoursesMock() {
  return (
    <div className="bg-canvas p-5">
      {/* Streak strip */}
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card">
        <Flame className="h-5 w-5 text-accent-orange" />
        <div className="flex-1">
          <p className="text-xs font-bold text-fg">7-day streak — incredible! 🔥</p>
          <div className="mt-1.5 flex gap-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div
                key={i}
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                  i < 7 ? "bg-accent-orange text-white" : "bg-surface-2 text-fg-faint"
                }`}
              >
                {d}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course cards */}
      <div className="flex flex-col gap-3">
        {COURSES.map((c) => (
          <div key={c.title} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
            <ProgressRing pct={c.pct} color={c.ringColor} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-xs font-bold text-fg">{c.title}</p>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: c.catBg, color: c.catColor }}
                >
                  {c.category}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.pct}%`, background: c.ringColor }}
                  />
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-fg-faint">
                  {c.pct}% · {c.lessons} lessons
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeatureCourses() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          {/* Visual */}
          <ScrollReveal className="w-full lg:w-[55%]">
            <BrowserFrame>
              <CoursesMock />
            </BrowserFrame>
          </ScrollReveal>

          {/* Text */}
          <ScrollReveal delay={0.1} className="w-full lg:w-[45%]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft">
              <BookOpen className="h-5 w-5 text-brand" />
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight text-fg sm:text-4xl">
              Learn on your schedule.
            </h2>
            <p className="mt-4 text-lg font-medium text-fg-muted">
              Short, structured courses designed for students who also have
              school, sports, and a life. Learn in 15-minute sessions; track
              real progress that actually motivates you to come back.
            </p>
            <p className="mt-3 text-base font-medium text-fg-muted">
              Every course is directly connected to the opportunities on your
              roadmap — you&apos;re not just studying; you&apos;re building the skills you
              need for that specific scholarship or program.
            </p>
            <a
              href="#product"
              className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline"
            >
              Browse the course library →
            </a>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
