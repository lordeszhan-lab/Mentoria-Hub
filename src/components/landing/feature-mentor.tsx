import { Sparkles } from "lucide-react";
import { BrowserFrame } from "./browser-frame";
import { ScrollReveal } from "./scroll-reveal";

const CHAT = [
  {
    role: "user",
    text: "What should I focus on this month to improve my NIS application?",
  },
  {
    role: "mentor",
    text: "Based on your roadmap, your strongest lever right now is completing the Research Writing course — it directly improves your Science section score. You have 18 days before the application opens. Want me to set a 3-session plan for this week?",
  },
  {
    role: "user",
    text: "Yes, that sounds great.",
  },
  {
    role: "mentor",
    text: "Done! I've added 3 sessions to your roadmap: Mon, Wed, Fri at times you chose during onboarding. I'll send a reminder the day before each one. 🗓️",
  },
];

const CHIPS = [
  "What's my next step?",
  "Show me my progress",
  "Find more STEM opportunities",
];

function MentorMock() {
  return (
    <div className="flex flex-col bg-canvas" style={{ minHeight: 360 }}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-black text-fg">AI Mentor</p>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-brand" />
            <p className="text-[10px] font-semibold text-fg-faint">Online · knows your plan</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-3 overflow-hidden px-4 py-4">
        {CHAT.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "mentor" && (
              <div className="mr-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[11px] font-medium leading-relaxed ${
                msg.role === "user"
                  ? "rounded-tr-sm bg-brand text-white"
                  : "rounded-tl-sm bg-surface text-fg shadow-sm border border-border"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Suggested action chips */}
      <div className="border-t border-border bg-surface px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold text-fg-faint">Quick actions</p>
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              className="rounded-full border border-brand-ring bg-brand-soft px-3 py-1 text-[10px] font-bold text-brand"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeatureMentor() {
  return (
    <section className="bg-surface-2 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-12 lg:flex-row-reverse lg:gap-16">
          {/* Visual */}
          <ScrollReveal className="w-full lg:w-[55%]">
            <BrowserFrame>
              <MentorMock />
            </BrowserFrame>
          </ScrollReveal>

          {/* Text */}
          <ScrollReveal delay={0.1} className="w-full lg:w-[45%]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft">
              <Sparkles className="h-5 w-5 text-brand" />
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight text-fg sm:text-4xl">
              A mentor that knows you.
            </h2>
            <p className="mt-4 text-lg font-medium text-fg-muted">
              Not a generic chatbot. An AI mentor that has read your roadmap,
              tracks your progress, and gives you concrete, specific guidance —
              available 24/7, whenever you have a question or hit a wall.
            </p>
            <p className="mt-3 text-base font-medium text-fg-muted">
              It knows what opportunities you&apos;re targeting, what courses you&apos;ve
              completed, and what&apos;s coming up next. Every answer is grounded in
              your actual plan.
            </p>
            <a
              href="#product"
              className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline"
            >
              Meet your mentor →
            </a>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
