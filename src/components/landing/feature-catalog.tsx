import { Search } from "lucide-react";
import { BrowserFrame } from "./browser-frame";
import { ScrollReveal } from "./scroll-reveal";

const CARDS = [
  { title: "NIS Olympiad — Physics", tag: "STEM", match: 91, chipBg: "#E3EDFB", ink: "#1E40AF" },
  { title: "Bolashak Presidential Scholarship", tag: "Finance", match: 78, chipBg: "#FFF6D6", ink: "#A16207" },
  { title: "MIT Science Award", tag: "Science", match: 84, chipBg: "#F6E9FF", ink: "#7E22CE" },
  { title: "Young Entrepreneurs Challenge", tag: "Business", match: 65, chipBg: "#FFF1E0", ink: "#C2410C" },
];

function CatalogMock() {
  return (
    <div className="bg-canvas p-5">
      {/* Search bar */}
      <div className="mb-4 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-fg-faint" />
        <span className="text-sm text-fg-faint">Filter by goal, grade, deadline…</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {CARDS.map((c) => (
          <div key={c.title} className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <div className="mb-3 flex items-start justify-between gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                style={{ background: c.chipBg, color: c.ink }}
              >
                {c.tag}
              </span>
              <MatchRing pct={c.match} />
            </div>
            <p className="text-xs font-bold leading-snug text-fg">{c.title}</p>
            <p className="mt-1 text-[10px] font-semibold text-brand">{c.match}% match</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchRing({ pct }: { pct: number }) {
  const r = 11;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={28} height={28} viewBox="0 0 28 28" className="-rotate-90 shrink-0">
      <circle cx={14} cy={14} r={r} fill="none" stroke="#E8ECEA" strokeWidth={2.5} />
      <circle
        cx={14} cy={14} r={r} fill="none"
        stroke="#16A34A" strokeWidth={2.5}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FeatureCatalog() {
  return (
    <section id="product" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          {/* Visual */}
          <ScrollReveal className="w-full lg:w-[55%]">
            <BrowserFrame>
              <CatalogMock />
            </BrowserFrame>
          </ScrollReveal>

          {/* Text */}
          <ScrollReveal delay={0.1} className="w-full lg:w-[45%]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E0F4FE]">
              <Search className="h-5 w-5 text-[#0369A1]" />
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight text-fg sm:text-4xl">
              One catalog, matched to you.
            </h2>
            <p className="mt-4 text-lg font-medium text-fg-muted">
              Stop scrolling through irrelevant Telegram channels. Mentoria Hub
              tracks 1,800+ opportunities — olympiads, scholarships, programs,
              internships — and scores each one against your grade, goals, and
              profile. You see only what actually fits.
            </p>
            <p className="mt-3 text-base font-medium text-fg-muted">
              Filter by deadline, category, or match score. Bookmark in one tap.
              Never miss a deadline that matters.
            </p>
            <a
              href="#product"
              className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline"
            >
              Explore the catalog →
            </a>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
