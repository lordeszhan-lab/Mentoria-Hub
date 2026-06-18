# Mentoria Hub — Landing Page Design Spec

> **Status:** Source of truth for the public marketing landing page (`src/app/(public)/page.tsx`). Read alongside `DESIGN_SYSTEM.md` — this file **inherits all tokens** (the green brand, Nunito, radii, accent palette) from it. Where this file and a build-prompt disagree, **this file wins for the landing**; where this file is silent, `DESIGN_SYSTEM.md` governs.
>
> **What this is NOT.** This is not the dashboard. The dashboard language (white `rounded-2xl` data cards on a near-white canvas, sidebar, stat rings) comes from Lumina/Edupro/Lurni. The **marketing landing has its own language** — editorial, type-led, conversion-engineered — drawn from how the best 2026 SaaS/EdTech sites actually present (Linear, Notion, Framer, Duolingo, Coursera, Brilliant). It must read as the front door of a *mature company*, not a hackathon demo.

---

## 0. The thesis (what "clean and beautiful" means here, grounded in real 2026 practice)

From studying the top EdTech and SaaS landing pages of 2025–2026, the patterns that actually convert and look premium are consistent:

1. **The hero is a layout system, not a banner.** In 2026 the hero is "a deliberate composition that establishes rhythm, tone, and expectation from the first screen" — typography, hierarchy, and negative space do the heavy lifting, *not decoration or noise* (Lexington Themes, Dec 2025). We build a **type-first split hero**: left = narrative headline + subhead + CTA + trust; right = a real product screenshot (the roadmap/dashboard).
2. **Show the product, don't describe it.** Notion, Linear, and Framer "visually show the product value before you scroll" (SaaSFrame 2026). The hero visual is the actual Mentoria roadmap UI, framed in a browser, so a visitor connects screen → outcome in <8 seconds.
3. **The 8-second / 50ms rule.** Visitors form a credibility opinion in under 50ms and decide to engage within ~8 seconds; 94% of first impressions are design-related (Merge, 2026). Therefore the headline must state the outcome plainly — "transparent, focused on results, simple to read" beats "impressive" (Veza Digital, 2026).
4. **Remove friction in the hero.** The best education pages cut barriers: Harvard's hero says "No application required to get started" with a progress bar already at 50%; others embed the signup form in the hero (Swipe Pages, 2026). Our hero CTA is one tap to start, **no signup wall to browse**.
5. **Trust above the fold.** A "trusted by / used by" bar or rating sits right under the CTA to "address skepticism before they scroll" (Memorable Design, May 2026). For us: a credibility row (schools/learners count, and — per the product strategy — a SOC-2-style trust signal and any awards), plus logos.
6. **Outcome-led sections, not feature dumps.** Coursera/Udacity win on "transparent outcomes and progress tracking"; sections are benefit-headlined with a matching product screenshot each (Merge, 2026; Notion below-fold pattern).
7. **Minimal motion that adds meaning, not noise.** 2026's strongest trend is "minimal motion that adds meaning" — scroll-reveal of sections, CTA hover, animated checkmarks on form fields, subtle icon motion as blocks enter view (SaaSFrame 2026). No GPU-gradient spectacle for its own sake.
8. **Mobile-first.** 60%+ traffic is mobile: headline readable without zoom and ideally ≤2 lines, hero visual must not push the value prop below the fold, tap targets ≥44px, forms use correct input types (Bullet.so, 2026).

**Synthesis for Mentoria:** a **light, editorial, type-led landing** with the brand green as the confident accent, one restrained gradient-mesh moment (hero background only), real product screenshots in browser frames throughout, outcome-led sections, trust signals high, and meaningful scroll-reveal motion. Clean like Linear/Notion; warm and approachable like Duolingo/Coursera; credible enough for a sponsor or a school to take seriously.

---

## 1. Visual language (landing-specific, inherits tokens from DESIGN_SYSTEM.md)

| Aspect | Decision |
|---|---|
| **Mode** | Light by default (education trust = clean + bright, per Clever/Coursera). Dark mode supported but light is the hero impression. |
| **Background** | `--canvas` near-white. **Exactly one** restrained gradient-mesh moment behind the hero (soft brand-green → teal → faint warm, very low saturation — think a quiet aurora, not a rave). Everything below the hero is calm white/`--surface-2` section bands. (§8 "no AI slop" applies — one mesh, not blobs everywhere.) |
| **Brand color** | The institutional green `--brand` (#16A34A) as the primary accent — CTAs, highlights, underlines, checkmarks. Accents (teal/blue/orange/purple/yellow) used sparingly to color category/feature icons only. |
| **Typography** | Nunito (from DESIGN_SYSTEM.md). Hero headline is **display-scale, weight 800–900**, tight leading, ≤2 lines on mobile. This is a **type-led** page — the headline is the largest visual element, bigger than on the dashboard. |
| **Shape** | Same fully-rounded language: `rounded-2xl` section cards/visual frames, `rounded-full` buttons/pills. Browser frames around screenshots have a `rounded-2xl` window with a subtle top bar. |
| **Imagery** | Real product screenshots (roadmap, catalog, course, certificate) in clean browser/device frames. Minimal geometric brand illustration only where a screenshot doesn't fit. **No stock photos of students, no AI-rendered 3D blobs, no mascot.** |
| **Density** | Generous, editorial. Big whitespace between sections (96–128px vertical rhythm on desktop). Each section breathes. |

---

## 2. Page structure (section-by-section blueprint)

The landing is a single scrolling page. Order is conversion-engineered (problem → product → proof → outcomes → how → who → pricing → final CTA). Each section is its own component under `src/components/landing/`.

### 2.1 Top navigation (`landing/nav.tsx`)
- Transparent over the hero mesh, becomes solid `--surface` with a hairline `--border` + soft shadow on scroll (sticky).
- Left: Mentoria Hub wordmark (green mark + Nunito 800). Center (desktop): anchor links — Product, How it works, For students, For mentors, Pricing. Right: a ghost "Log in" + a primary `rounded-full` "Get started free".
- Mobile: hamburger → full-screen sheet menu, CTA pinned at bottom.
- CTA is persistent (nav + hero + mid-page + footer) but never aggressive — earned by surrounding content (Notion pattern).

### 2.2 Hero (`landing/hero.tsx`) — the make-or-break screen
**Layout:** split, desktop ~40% text / ~60% visual; stacks vertically on mobile (text first, value prop stays above the fold).
- **Eyebrow pill** (`rounded-full`, brand-soft bg, brand ink): a short positioning line, e.g. "Your academic navigator, grades 8–11".
- **Headline (display, 800–900, ≤2 lines):** narrative + outcome. Working copy: *"Find every opportunity. Build your roadmap. Get into your dream university."* — plain, result-focused, scroll-stopping. (Final copy is a content decision; the spec is: one clear outcome sentence, not a clever abstraction.)
- **Subhead (body-lg, muted):** one sentence on *how* — "Mentoria Hub turns scattered olympiads, scholarships, and courses into one personal plan — with an AI mentor that knows where you're headed."
- **CTA row:** primary `rounded-full` "Start free — no application needed" (friction-removal, Harvard pattern) + secondary ghost "See how it works" (scrolls to demo). Tap ≥44px.
- **Trust strip (immediately under CTA):** small muted row — e.g. "Built for KZ + international students • SOC 2-grade security • Free to start" and/or a learners/schools count once real. Logos row optional (partner/school logos in grayscale).
- **Hero visual (right):** the **real roadmap screen** in a `rounded-2xl` browser frame, slightly tilted or straight, with a soft shadow and one or two floating accent chips (a match-score ring, a streak flame) peeking at the edges to hint at the product's personality — *subtle*, 2 max, not a collage. A gentle scroll-parallax or a 3-second autoplay of the roadmap assembling is allowed (meaningful motion).

### 2.3 Logo / trust bar (`landing/trust-bar.tsx`)
- A thin band: "Trusted by students from…" + grayscale school/partner logos, or key numbers (opportunities tracked, roadmaps generated). Neutralizes doubt before deeper scroll. If real logos don't exist yet, use credible stat chips instead of fake logos.

### 2.4 Problem → insight (`landing/problem.tsx`)
- A short, empathetic section naming the student's pain (the chaos of scattered opportunities, missed deadlines, no map) — 1 headline + 2–3 supporting lines, optionally a small "before" visual (a messy feed) vs the calm product. Sets up why the product exists. Keep tight; don't wallow.

### 2.5 Product showcase — outcome-led feature blocks (`landing/feature-*.tsx`)
Three to four alternating left/right blocks, each = benefit headline (h2) + 2–3 outcome sentences + a real product screenshot in a frame. Animated screenshot reveals on scroll (Notion pattern). The four blocks map to the product pillars:
1. **"One catalog, matched to you."** — catalog screenshot with match-score rings. Outcome: stop missing opportunities; see only what fits your grade and goals.
2. **"Your roadmap to university."** — the roadmap timeline screenshot. Outcome: know exactly what to do this term to get where you're going. (This is the hero feature — give it the most space.)
3. **"Learn on your schedule."** — course/lesson screenshot with progress + streak. Outcome: courses that fit around school, with progress that motivates.
4. **"A mentor that knows you."** — AI Mentor panel screenshot. Outcome: 24/7 guidance grounded in your actual plan.

Each block: icon (pastel squircle, accent-colored) + headline + copy + a small inline "Learn more" text link. No feature checklists dumped as walls of text.

### 2.6 How it works (`landing/how.tsx`)
- 3 simple steps with numbered pastel chips: **1. Tell us your goal → 2. Get your personal roadmap → 3. Follow it, step by step.** Each with a one-line description and a tiny illustrative visual. Reinforces low friction and the core loop.

### 2.7 Outcomes / proof (`landing/proof.tsx`)
- Transparent outcomes + social proof (Coursera/Udacity pattern). A row of **stat cards** (animated count-up, reusing the dashboard StatCard aesthetic but on the landing): e.g. opportunities in the catalog, roadmaps generated, courses, certificates issued. Plus 2–3 **specific testimonials** with name, grade/school, and a concrete result (not generic praise) — once real; until then, omit fake testimonials and lean on stats + the product itself.

### 2.8 For mentors / institutions (`landing/for-mentors.tsx`)
- A short B2B-leaning band (the strategy's "institutional face"): how Mentoria scales mentoring and gives schools/sponsors a real product with data. A secondary CTA "For schools & mentors" → a contact/learn-more path. This is what makes the page credible to a sponsor, not just a student.

### 2.9 Pricing (`landing/pricing.tsx`) — only if/when defined
- Pricing was flagged as undefined in the product notes. **Do not invent prices.** Until pricing exists, this section is either omitted or replaced with a single "Free to start" card + "Contact us for schools". When pricing is set: 2–3 `rounded-2xl` plan cards, the recommended one accented (border + a "Most popular" pill), transparent inclusions, clear `rounded-full` CTAs. Anchor value (free to start; school plans on request).

### 2.10 FAQ (`landing/faq.tsx`)
- Accordion (shadcn), 5–8 questions addressing real objections (Is it free? Which grades? KZ + international? Is my data safe? Do I need a mentor already? How is the roadmap made?). Calm, plain answers. Reduces support load + builds trust.

### 2.11 Final CTA (`landing/cta.tsx`)
- A full-width brand-tinted band (soft brand gradient, not loud): big headline ("Start building your roadmap today"), one primary `rounded-full` CTA, one reassurance line ("Free to start • no application needed"). The last push.

### 2.12 Footer (`landing/footer.tsx`)
- Clean multi-column: product links, for students / for mentors, company, legal (privacy/terms — important for a minor-facing product), locale switcher (RU/EN/KK), socials. Wordmark + a one-line mission. Hairline top border.

---

## 3. Motion (meaningful, not noisy — the 2026 standard)
- **Scroll-reveal:** sections fade + rise 12–16px as they enter view, once (not on every scroll). Stagger child elements 40–60ms.
- **Hero visual:** optional 3-second "roadmap assembling" autoplay OR gentle parallax on the frame; one floating chip drifts subtly. Nothing loops forever.
- **CTA hover:** slight scale + the brand ledge feel (lighter than the in-app 3D button — landing CTAs can be flat-premium with a soft hover lift rather than the full Duolingo ledge, to keep the marketing page elegant). Pick one and stay consistent.
- **Stat count-up:** numbers animate when the proof section enters view (tabular nums).
- **Form feedback:** animated green checkmark when the email field is valid (SaaSFrame pattern).
- **Respect `prefers-reduced-motion`:** disable parallax/autoplay/count-up, keep static.
- **Banned:** GPU-gradient cinematic spectacle, infinite background animations, parallax everywhere, anything delaying a tap. (Linear gets away with cinematic dark gradients because it's a developer tool; our audience is students + schools, so we stay light, warm, and fast.)

---

## 4. Copy tone
- Plain, warm, outcome-first. Speak to the student ("you"), with a credible aside for parents/schools. No jargon, no hype, no "revolutionary". The word **"autopilot" is banned** (carried from the product system). Headlines state results; subheads explain how; buttons say what happens next ("Start free", "See how it works", "Generate my roadmap").
- Reading level appropriate for 13–17-year-olds and the adults who fund them. Short sentences. Specific over abstract.

---

## 5. Performance & SEO/GEO (it's a real front door)
- **Fast:** the hero must be LCP-optimized — the headline is text (not an image), the hero screenshot is an optimized `next/image` with priority, fonts via `next/font` (no FOUT). Target a clean Lighthouse.
- **Responsive:** verify mobile — headline ≤2 lines, value prop above fold, hero visual below text on mobile, tap targets ≥44px, real input types on the email field.
- **Semantic + crawlable:** proper heading hierarchy (one h1 = the hero headline), JSON-LD (Organization + Product), descriptive meta + OpenGraph, and (per the product strategy's GEO emphasis) an `llms.txt` and AI-crawler-friendly `robots`. Localized metadata for RU/EN/KK.
- **Accessible:** color contrast on green CTAs and accent text passes; focus states visible; the page is fully keyboard-navigable; images have alt text.

---

## 6. Build note for the Cursor prompt
The landing is **one prompt** in the pipeline (early, right after scaffold, since it's the public face and can be built before auth/data). That prompt must include the contract line:

> **Design:** Follow `LANDING_DESIGN.md` and inherit tokens from `DESIGN_SYSTEM.md`. Light, editorial, type-led marketing page: split type-first hero (narrative outcome headline ≤2 lines + real roadmap screenshot in a rounded-2xl browser frame), one restrained brand gradient-mesh behind the hero only, trust strip above the fold, outcome-led alternating feature blocks with real product screenshots, how-it-works 3 steps, proof stats (count-up) — no fake testimonials/logos, omit pricing until defined, FAQ accordion, brand-tinted final CTA, clean footer with RU/EN/KK switcher. Meaningful scroll-reveal motion only (respect prefers-reduced-motion). Honor the §8 "no AI slop" list from DESIGN_SYSTEM.md. Green `--brand` as the confident accent; Nunito; fully rounded (cards rounded-2xl, buttons rounded-full). Compose from shadcn base-nova + Magic UI / 21st.dev / React Bits; never hand-roll UI a library provides. LCP-optimized hero (text headline, priority next/image screenshot), responsive (headline ≤2 lines mobile, value prop above fold, ≥44px taps), semantic headings + JSON-LD + localized metadata. End with `npm run typecheck` passing.

---

## 7. Quick reference — what makes THIS landing premium (the checklist)
- [ ] Type-led split hero; outcome headline ≤2 lines; real product screenshot in a frame.
- [ ] One restrained gradient-mesh (hero only); calm white below.
- [ ] One tap to start; no signup wall to browse; "no application needed" friction-remover.
- [ ] Trust strip above the fold (stats/SOC-2-grade/awards; real logos or none).
- [ ] Outcome-led feature blocks, each with a real screenshot; roadmap block largest.
- [ ] 3-step "how it works"; proof stats with count-up; no fake testimonials.
- [ ] "For mentors/schools" band for institutional credibility.
- [ ] No invented pricing; FAQ addresses real objections; brand-tinted final CTA.
- [ ] Meaningful motion only; reduced-motion respected; LCP-fast; mobile-perfect.
- [ ] No stock photos, no AI 3D blobs, no mascot, no purple-gradient slop, "autopilot" banned.
