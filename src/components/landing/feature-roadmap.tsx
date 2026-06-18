import { Map } from "lucide-react";
import { BrowserFrame } from "./browser-frame";
import { ScrollReveal } from "./scroll-reveal";

const STEPS = [
  {
    status: "done",
    title: "STEM Olympiad Registration",
    type: "Opportunity",
    deadline: "Sep 14",
    typeColor: "#1CB0F6",
    typeBg: "#E0F4FE",
    note: "Submitted ✓",
  },
  {
    status: "done",
    title: "Research Project — Physics Module",
    type: "Course",
    deadline: "Oct 5",
    typeColor: "#FF9600",
    typeBg: "#FFF1E0",
    note: "Completed ✓",
  },
  {
    status: "in_progress",
    title: "NIS Scholarship Application",
    type: "Opportunity",
    deadline: "Nov 30",
    typeColor: "#16A34A",
    typeBg: "#DCFCE7",
    note: "In progress",
  },
  {
    status: "available",
    title: "University Essay Workshop",
    type: "Course",
    deadline: "Jan 15",
    typeColor: "#CE82FF",
    typeBg: "#F6E9FF",
    note: "Start now",
  },
  {
    status: "locked",
    title: "Bolashak Pre-selection Test",
    type: "Opportunity",
    deadline: "Mar 20",
    typeColor: "#6B7280",
    typeBg: "#F7F9F8",
    note: "Unlocks Jan",
  },
];

function RoadmapDetailMock() {
  return (
    <div className="bg-canvas p-5">
      {/* Hero step card */}
      <div className="mb-5 rounded-2xl border-2 border-brand bg-surface p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand">
              Next move
            </p>
            <p className="mt-1 text-sm font-black text-fg">
              NIS Scholarship Application
            </p>
            <p className="mt-0.5 text-xs text-fg-muted">
              Deadline: <span className="font-semibold text-accent-orange">Nov 30</span> · 28 days left
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-brand px-3 py-1.5 text-[10px] font-bold text-white">
            Start →
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-soft">
          <div className="h-full w-[40%] rounded-full bg-brand" />
        </div>
        <p className="mt-1 text-[10px] font-semibold text-fg-muted">40% complete</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[9px] font-bold ${
                  step.status === "done"
                    ? "border-brand bg-brand text-white"
                    : step.status === "in_progress"
                      ? "border-accent-orange bg-accent-orange text-white"
                      : step.status === "available"
                        ? "border-brand-ring bg-surface text-brand"
                        : "border-border bg-surface-2 text-fg-faint"
                }`}
              >
                {step.status === "done" ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`my-0.5 w-px flex-1 ${step.status === "done" ? "bg-brand" : "bg-border"}`}
                  style={{ minHeight: 24 }}
                />
              )}
            </div>

            <div
              className={`mb-2 flex-1 rounded-xl border p-2.5 ${
                step.status === "locked" ? "opacity-50" : ""
              } border-border bg-surface`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[11px] font-bold text-fg">{step.title}</p>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold"
                  style={{ background: step.typeBg, color: step.typeColor }}
                >
                  {step.type}
                </span>
              </div>
              <p className="mt-0.5 text-[9px] text-fg-faint">
                {step.deadline} · {step.note}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeatureRoadmap() {
  return (
    <section className="bg-surface-2 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-12 lg:flex-row-reverse lg:gap-16">
          {/* Visual — roadmap gets extra width */}
          <ScrollReveal className="w-full lg:w-[58%]">
            <BrowserFrame>
              <RoadmapDetailMock />
            </BrowserFrame>
          </ScrollReveal>

          {/* Text */}
          <ScrollReveal delay={0.1} className="w-full lg:w-[42%]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft">
              <Map className="h-5 w-5 text-brand" />
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight text-fg sm:text-4xl">
              Your roadmap to university.
            </h2>
            <p className="mt-4 text-lg font-medium text-fg-muted">
              Know exactly what to do this term — and this year — to get where
              you&apos;re going. Mentoria generates a personalised, step-by-step plan
              that adapts as you progress.
            </p>
            <ul className="mt-5 space-y-3">
              {[
                "Sequenced by priority and deadline, not random to-dos",
                "Color-coded by category and urgency so nothing gets lost",
                "Each step links directly to an application, course, or action",
                "Progress tracked automatically as you complete steps",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-black text-brand">
                    ✓
                  </span>
                  <span className="text-sm font-semibold text-fg-muted">{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="#product"
              className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline"
            >
              See the roadmap in action →
            </a>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
