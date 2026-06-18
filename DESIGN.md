# Mentoria Hub — Design System

> **Status:** Source of truth for all UI. Every Cursor build-prompt references this file. If a build-prompt and this file disagree, **this file wins.**
>
> **Design language: "Premium-EdTech base + Duolingo joy layer" (hybrid).**
> The skeleton, chrome, and data surfaces follow the three reference dashboards (Lumina, Edupro, Lurni): white `rounded-2xl` cards on a near-white canvas, **green as the primary brand color**, pastel icon chips, colored progress rings, clean multi-weight typography, generous whitespace, and **zero "AI slop"** (no glossy gradient buttons, no purple-on-purple, no decorative noise, no fake-3D everywhere). The **joy layer** — Duolingo's 3D press buttons, streak flames, XP bursts, and micro-celebrations — is applied **selectively** to the learning and gamification surfaces (courses, quizzes, streak, roadmap step completion). It is **never** applied to admin, forms, or data tables, which stay calm and businesslike.
>
> **One-line litmus test for every screen:** *Minimal but colorful, instantly legible, never noisy.* If a screen looks busy, remove color and motion until it reads in one glance — then add back only what aids comprehension.

---

## 0. Where the language comes from (so the agent understands intent, not just tokens)

**From the three references (the BASE — applies everywhere):**
- **Lumina:** near-white canvas, white `rounded-2xl` cards with soft shadows, **green primary** (`#16A34A`-ish) for bars/positive states, pastel icon chips top-right of stat cards, a multi-segment colored donut, a black pill CTA ("Create Exam"), a centered pill nav. Charts use a solid-green + hatched-green pairing (completed vs in-progress). This is our **stat-card + chart + chrome** reference.
- **Edupro:** left sidebar nav with a **solid green active item** (white text, rounded), pastel circular icon chips, **colored progress rings** (green/orange/purple/blue) per metric, a green encouragement banner, course rows with thin progress bars + status pills, and a **streak strip with flame emojis per weekday**. This is our **student-dashboard + course-list + streak** reference.
- **Lurni:** clean sidebar with **square-rounded colored icon tiles** (blue/green/orange) per stat, a soft-blue gradient bar chart with a focused (saturated) bar + tooltip, an activity feed with avatars, an "AI Summary" sparkle affordance, and a calm data table. This is our **admin + analytics** reference.

**From Duolingo (the JOY LAYER — applies only to learning/gamification):**
- Official core palette (from design.duolingo.com): **Feather Green `#58CC02`**, Mask Green `#89E219`, **Eel `#4B4B4B`** (text), **Snow `#FFFFFF`** (bg). Secondary: **Macaw `#1CB0F6`** (blue), **Cardinal `#FF4B4B`** (error/hearts/streak-danger), **Bee `#FFC800`** (yellow/reward), **Fox `#FF9600`** (orange), **Beetle `#CE82FF`** (purple), **Humpback `#2B70C9`** (deep blue). Neutrals: Wolf `#777`, Hare `#AFAFAF`, Swan `#E5E5E5`, Polar `#F7F7F7`.
- **The button:** flat fill + a solid bottom "ledge" (`box-shadow: 0 4px 0 <darker>`), `:active` collapses the ledge and `translateY(4px)` — the tactile press. Fully rounded-ish (`border-radius` large). Uppercase or bold weight. **This is our PRIMARY action button.**
- **Rounded everything, friendly forms, big tap targets, instant feedback, micro-celebrations** (streak +1 flame pop, XP count-up, lesson-complete confetti — brief and tasteful, never blocking).

**Synthesis decision:** Mentoria's brand green is a **slightly more "institutional" green than Duolingo's neon `#58CC02`** (we need to look credible to sponsors/schools, per the product strategy), but the *interaction feel* of the learning surfaces borrows Duolingo's tactility. We keep Duolingo's exact secondary palette for accents and gamification because it's proven, vibrant, and legible.

---

## 1. Color tokens

All colors are defined as CSS custom properties in the Tailwind v4 `@theme` block in `src/app/globals.css`, with light + dark values. Reference them via Tailwind utilities (e.g. `bg-[--surface]`, `text-[--fg]`) or mapped Tailwind color names. **Never hardcode hex in components** — always go through a token.

### 1.1 Brand & primary
| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand` | `#16A34A` | `#22C55E` | Primary brand green. CTAs, active nav, positive accents. (Institutional cousin of Duolingo green.) |
| `--brand-strong` | `#15803D` | `#16A34A` | The 3D button "ledge"/bottom shadow; pressed states; brand text on light. |
| `--brand-soft` | `#DCFCE7` | `#14352447` | Soft green fill behind brand icon chips, success banners. |
| `--brand-ring` | `#86EFAC` | `#22C55E` | Progress-ring brand track. |

### 1.2 Accent palette (categories, charts, gamification) — borrowed from Duolingo secondaries
| Token | Hex | Maps to |
|---|---|---|
| `--accent-blue` | `#1CB0F6` | Programming category; "info"; chart series B |
| `--accent-deep-blue` | `#2B70C9` | STEM category; chart series C |
| `--accent-yellow` | `#FFC800` | Reward/XP; Finance category; highlight |
| `--accent-orange` | `#FF9600` | Business category; "in-progress" warm; warning |
| `--accent-purple` | `#CE82FF` | Science category; chart series D |
| `--accent-red` | `#FF4B4B` | Error; deadline-danger; streak-loss; destructive |
| `--accent-teal` | `#14B8A6` | Social Impact category; secondary brand support |

**Category → accent map (the 6 directions). Each gets a `chip` (pastel bg) + `ink` (saturated fg):**
| Category | Accent token | Pastel chip bg (light) | Icon ink |
|---|---|---|---|
| Business | `--accent-orange` | `#FFF1E0` | `#C2410C` |
| STEM | `--accent-deep-blue` | `#E3EDFB` | `#1E40AF` |
| Social Impact | `--accent-teal` | `#D7F5F0` | `#0F766E` |
| Finance | `--accent-yellow` | `#FFF6D6` | `#A16207` |
| Programming | `--accent-blue` | `#E0F4FE` | `#0369A1` |
| Science | `--accent-purple` | `#F6E9FF` | `#7E22CE` |

> Pastel chips are the Edupro/Lurni "circular icon tile" pattern. The icon is the saturated `ink`; the tile is the pastel `chip`. **This pastel-chip-with-saturated-icon is the single most reused visual motif in the product** — catalog cards, dashboard widgets, roadmap steps, course cards all use it.

### 1.3 Surfaces & neutrals
| Token | Light | Dark | Use |
|---|---|---|---|
| `--canvas` | `#F6F8F7` | `#0B0F0E` | App background (near-white, faint green-gray — like Lumina/Edupro). |
| `--surface` | `#FFFFFF` | `#14201C` | Cards, sheets, popovers. |
| `--surface-2` | `#F7F9F8` | `#1B2A25` | Nested/inset surfaces, table header rows. |
| `--border` | `#E8ECEA` | `#26352F` | Hairline borders (1px). Cards lean on shadow, not heavy borders. |
| `--fg` | `#1A1A1A` | `#F3F5F4` | Primary text (Duolingo "Eel" cousin). |
| `--fg-muted` | `#6B7280` | `#9AA5A0` | Secondary text, labels, captions. |
| `--fg-faint` | `#9CA3AF` | `#6B7672` | Tertiary, placeholders, disabled. |

### 1.4 Semantic states
| Token | Hex (light) | Use |
|---|---|---|
| `--success` | `#16A34A` | Completed, passed, done. (== brand) |
| `--warning` | `#FF9600` | In-progress warm, approaching deadline (8–30d). |
| `--danger` | `#FF4B4B` | Overdue, <7d deadline, errors, destructive. |
| `--info` | `#1CB0F6` | Neutral info, hints. |

### 1.5 Dark mode rule
Dark is a **true dark green-gray**, not pure black: canvas `#0B0F0E`, surfaces lift with `--surface`/`--surface-2`. Accents stay vivid (they read well on dark). Pastel chips invert to **low-opacity tints of the accent** (e.g. `accent-blue @ 14%`) with the saturated icon kept bright. Shadows are reduced; rely more on `--surface-2` elevation and subtle borders. **Audit every screen in dark (Prompt 10 §D).**

---

## 2. Typography

**Fonts (the Duolingo two-font logic, adapted to free fonts):**
- **Display / headings → a rounded, friendly bold sans.** Use **Nunito** (free, rounded, the closest legal stand-in for Feather Bold / DIN Rounded's personality) at weights 700–900. Loaded via `next/font/google`.
- **Body / UI → the same family at 400–600**, or pair with Inter for dense data tables if needed. Default: Nunito everywhere for warmth; Inter only inside admin data tables for tighter legibility (optional).
- Numerals in stats/counters: tabular figures (`font-variant-numeric: tabular-nums`) so animated counters don't jitter.

**Type scale (rem):**
| Token | Size / line | Weight | Use |
|---|---|---|---|
| `display` | 2.5 / 1.1 | 800 | Page hero ("Welcome back, Aruzhan") |
| `h1` | 2.0 / 1.15 | 800 | Section page titles |
| `h2` | 1.5 / 1.2 | 700 | Card/section headers |
| `h3` | 1.25 / 1.3 | 700 | Sub-headers, widget titles |
| `body-lg` | 1.125 / 1.5 | 500 | Lead paragraphs |
| `body` | 1.0 / 1.5 | 400–500 | Default |
| `label` | 0.875 / 1.4 | 600 | Form labels, captions, chip text |
| `caption` | 0.75 / 1.4 | 500 | Meta, timestamps, helper |
| `stat` | 2.0–2.5 / 1.0 | 800 | The big number in stat cards (tabular) |

**Rules:** Headlines use the "Welcome **bold** + name in lighter weight" pattern from Lumina (`Welcome` 800 + `Mahmud!` 400/muted) — adopt it for the dashboard hero. Never more than 2 weights in one component. Body line-length max ~70ch.

---

## 3. Shape, elevation, spacing

### 3.1 Radius (fully rounded — non-negotiable)
| Token | Value | Use |
|---|---|---|
| `--r-card` | `1rem` (16px) → `rounded-2xl` | All cards, sheets, modals, large surfaces |
| `--r-md` | `0.75rem` (12px) | Inputs, small tiles, icon chips (squircle tiles) |
| `--r-pill` | `9999px` → `rounded-full` | Buttons, pills, chips, badges, progress bars, tags, avatars |
| `--r-ring` | n/a | Progress rings are SVG circles |

**Hard rule: no sharp corners anywhere.** Cards `rounded-2xl`; every button/pill/chip/bar/tag/badge `rounded-full`; icon tiles `rounded-xl`/`rounded-2xl` (squircle, the Lurni tile look). If a default shadcn component ships square, override the radius.

### 3.2 Elevation (soft, like the references — not heavy)
| Token | Shadow | Use |
|---|---|---|
| `--shadow-card` | `0 1px 2px rgb(16 24 20 / 0.04), 0 8px 24px rgb(16 24 20 / 0.06)` | Resting cards |
| `--shadow-card-hover` | `0 2px 4px rgb(16 24 20 / 0.06), 0 14px 32px rgb(16 24 20 / 0.10)` | Card hover/active |
| `--shadow-pop` | `0 8px 30px rgb(16 24 20 / 0.12)` | Popovers, tooltips, dropdowns |
| `--ledge-brand` | `0 4px 0 var(--brand-strong)` | **The Duolingo 3D button ledge** (primary action only) |
| `--ledge-neutral` | `0 4px 0 var(--border)` | Secondary 3D button ledge |

Cards are **shadow-led, border-light** (1px `--border` optional). Avoid stacking heavy borders + heavy shadows (looks cheap).

### 3.3 Spacing & layout
- **Base unit 4px.** Use a 4/8 rhythm. Card padding `20–24px` (`p-5`/`p-6`). Section gap `24px` (`gap-6`). Widget grid gap `20–24px`.
- **Container:** max content width ~1280px; app uses a **left sidebar (240–264px) + fluid content** for the authed app and admin (Edupro/Lurni pattern). Public/marketing pages are centered with a top nav (Lumina pattern).
- **Grid:** dashboard = responsive CSS grid, 12-col mental model; widgets span 4/6/8/12. Collapses to 1-col on mobile. Min card width ~280px before wrap.
- **Density:** generous. Whitespace is a feature — the references breathe. Never pack a card edge-to-edge.

---

## 4. Motion

**Principles:** motion clarifies, never blocks. Two speeds: **functional** (fast, 120–220ms, ease-out) for UI state, and **joyful** (spring, slightly bouncy) reserved for gamification moments. Respect `prefers-reduced-motion` (drop joyful, keep functional minimal).

| Motion | Spec | Where |
|---|---|---|
| Card entrance | fade + 8px rise, staggered 40–60ms, ease-out 200ms | Dashboard widgets, catalog grid, roadmap steps (Magic UI / framer-motion) |
| Hover lift | `translateY(-2px)` + shadow-card→hover, 150ms | Cards, course tiles |
| **3D button press** | ledge `0 4px 0` → `0 0` + `translateY(4px)`, 60–80ms | Primary actions (learning surfaces) |
| Count-up | number animates to value, 600–900ms ease-out, tabular nums | Stat cards, XP, deadlines count |
| Progress ring fill | stroke-dashoffset animates from 0, 700ms ease-out | Course %, performance gauge |
| Bar grow | bars grow from baseline, staggered | Charts (Lumina/Lurni style) |
| **Streak +1** | flame scales 1→1.25→1 spring + tiny ember particles | On streak increment (Duolingo joy) |
| **Lesson complete** | brief confetti burst (1.2s, auto-clear) + XP count-up | Lesson/quiz pass, roadmap step done |
| Skeleton shimmer | left-right shimmer, 1.4s loop | All loading states |
| Mentor typing | streamed tokens + a soft pulse on the avatar | AI Mentor responses |

**Banned motion:** infinite looping decorative animations, parallax for its own sake, anything that delays a tap response, full-screen blocking celebrations. Confetti is ≤1.2s and never blocks the next action.

---

## 5. Core components (the spec every build-prompt composes from)

> Build these as composed components over **shadcn/ui (base-nova)**, enriched with **Magic UI / 21st.dev / React Bits** for animated pieces. **Never hand-roll** what a library provides. Engine/brand logos only from `@lobehub/icons`.

### 5.1 Buttons
Three variants. The primary uses the **Duolingo 3D ledge**; secondary/ghost are calmer (used in admin/forms where 3D would be too playful).

- **`Button` (primary, "joy"):** fill `--brand`, text white, weight 700, `rounded-full`, `--ledge-brand` (`0 4px 0 --brand-strong`), `:active` → `translateY(4px)` + ledge collapses. Size md = 44px tall, lg = 52px. Use for the hero CTAs, "Generate my roadmap", "Mark complete", "Start lesson", quiz submit.
- **`Button variant="secondary"`:** `--surface`, text `--brand`, 1px `--border`, `--ledge-neutral`, same press. For secondary actions.
- **`Button variant="ghost"` / `outline`:** no ledge, flat, subtle hover bg. For admin, toolbars, low-emphasis.
- **`Button variant="destructive"`:** `--danger` fill, white text, ledge `0 4px 0 #C81E1E`.
- **Black pill CTA** (Lumina "Create Exam"): an optional `variant="contrast"` — solid `--fg` bg, white text, `rounded-full`, `+` icon — for the single most important page action in admin/header.

Icon buttons: 40px circle, `rounded-full`, ghost by default (the settings/bell pills in Lumina).

### 5.2 Card
- `rounded-2xl`, `--surface`, `--shadow-card`, padding `p-5/p-6`, optional 1px `--border`.
- **Header pattern:** title (`h3`, 700) left; optional pastel icon chip or a control (dropdown/segmented) right (Lumina "Exam / January ▾", Lurni "This Month ▾").
- Hover (when interactive): lift + shadow-hover.
- **StatCard** sub-variant (Lumina/Lurni): big `stat` number (tabular, count-up), a `label` under it, and a **pastel icon tile** (squircle, category/accent colored) in the top-right. Optional sparkline or mini progress strip at the bottom (Lumina "Subscriptions" multi-segment bar).

### 5.3 Icon chip / tile (the signature motif)
- **Squircle tile:** `rounded-xl`/`rounded-2xl`, pastel `chip` bg, saturated `ink` icon (lucide or `@lobehub/icons`). Sizes 36/40/48px. Used in stat cards, list rows, category labels.
- **Pill chip:** `rounded-full`, pastel bg + ink text, for category tags / filters (the Edupro "Physics 1" colored pill).

### 5.4 Progress
- **Ring (gauge):** SVG circle, track `--surface-2`/faint, fill = accent (brand for performance, category accent for course). Center shows % or `n/total` (Edupro "70%", "20/30"). Animated fill. The big "Overall performance 80% PRO LEARNER" gauge is a half-ring brand gauge.
- **Bar:** `rounded-full`, track faint, fill accent; thin (6–8px) in list rows (Edupro course rows), thick + segmented for composite metrics (Lumina "Active/Expired/Canceled" multi-color bar).
- **Step/timeline progress:** the roadmap rail (see 5.8).

### 5.5 Badge / status pill
- `rounded-full`, small, pastel bg + ink. States: `In progress` (warm orange dot + text), `Completed` (green check + text), `Locked` (gray), deadline pills colored by urgency (green >30d, orange 8–30d, red <7d). Edupro status-pill pattern.

### 5.6 Navigation
- **Sidebar (authed app + admin):** `--surface`, 240–264px, sections with a `MAIN` / `OTHER` muted label (Edupro). Active item = **solid `--brand` fill, white text, `rounded-full`/`rounded-xl`** with the icon (Edupro). Inactive = `--fg-muted`, hover `--surface-2`. Bottom: user/teams block (Lurni "TEAMS" with colored tiles). Collapsible (Lurni collapse icon).
- **Top bar (public):** centered pill nav (Lumina) OR left logo + right actions. Right side: search, notification bell (with red count dot, Lurni), avatar.
- **App header:** breadcrumb/page title left; search center/right (Lurni rounded search with filter icon); XP + streak + bell + avatar right.

### 5.7 Charts (Lumina / Lurni look)
- **Bars:** `rounded-full`/`rounded-t-xl` tops, brand green or soft-blue gradient; a **focused bar is saturated** while others are tinted (Lurni UX Design bar), with a floating tooltip card (`--shadow-pop`, rounded-2xl). Completed vs in-progress = solid + hatched/tinted pairing (Lumina).
- **Donut/gauge:** multi-segment with the accent palette, thick rounded arcs, center total (Lumina Exam donut: green/purple/blue/orange). Legend = dot + label + value.
- **Library:** Recharts, themed to tokens (rounded bars, branded colors, soft grid). No default Recharts styling.

### 5.8 Roadmap timeline (the product centerpiece — bespoke)
- **Vertical rail** with grade→term groups. Each step = `rounded-2xl` card on the rail, connected by a vertical line. Card shows: kind icon (pastel tile: opportunity/course/action), title (`h3`), rationale (`body`, muted), linked item chip, deadline pill (urgency colored), match-score mini-ring, and a status control.
- **Status visuals:** `done` = brand fill check + rail segment turns green; `in_progress` = warm ring; `available` = neutral; `locked` = faint + lock icon. Completing a step animates the rail fill + a brief joy pulse.
- **"Next move" highlight:** a larger brand-accented card at top, slightly elevated, with a primary 3D CTA.

### 5.9 Course & lesson surfaces (joy layer ON)
- **Course card:** `rounded-2xl`, category accent cover band, title, level pill, lesson count, **progress ring** if enrolled, 3D "Continue"/"Enroll" button.
- **Lesson player:** clean reading column, portable content blocks, video card, materials list, a sticky 3D "Mark complete" button. Quiz = big rounded option buttons (tap targets ≥48px), instant correct/incorrect color + explanation, score ring, retry. Lesson-complete = confetti + XP count-up.
- **Streak strip (Edupro):** 7 weekday flames; active days = lit flame (`--accent-orange`/red), today emphasized; copy encouraging ("5 days strong!"), never shaming.

### 5.10 AI Mentor
- Floating `rounded-full` launcher (brand, with a subtle sparkle — but **no "AI slop"**: one tasteful sparkle icon, not a glowing gradient orb). Opens a `Sheet` side panel: chat bubbles (user = brand-tinted right, mentor = surface left), streamed tokens, suggested-action chips the user taps to confirm. Calm, readable, premium — closer to Linear's command palette than a gimmicky chatbot.

### 5.11 Empty, loading, error states
- **Empty:** a soft pastel illustration-ish block (simple shapes, brand/accent), a one-line friendly message, and a single 3D CTA. Never a bare "No data".
- **Loading:** skeletons matching the real layout (shimmer), or a multi-line status for long AI jobs ("Analyzing your profile… / Matching opportunities… / Sequencing your plan…") — neutral copy, the word "autopilot" is banned.
- **Error:** calm, `--danger` accent, plain-language message + retry. Never dump stack traces.

---

## 6. Iconography & illustration
- **Icons:** lucide-react for UI; `@lobehub/icons` for brand/engine logos (and AI-provider marks if shown). Consistent stroke weight (~1.75–2px). Icons sit in pastel squircle tiles on data surfaces.
- **No mascot.** Unlike Duolingo, Mentoria has no owl. We borrow Duolingo's *interaction joy*, not a cartoon character — this keeps the "institutional credibility for sponsors" the strategy requires. (If a friendly motif is ever wanted, use abstract brand shapes, not a character.)
- **Illustration:** minimal, geometric, brand/accent-tinted. Used only in empty states and onboarding. No stocky 3D renders, no AI-generated clutter.

---

## 7. Accessibility
- Contrast: text ≥ 4.5:1; large text/UI ≥ 3:1. Verify accent-on-pastel and white-on-brand pass. `--fg-muted` must stay ≥4.5:1 on `--surface`.
- Every icon-only button has an `aria-label`. Visible focus rings (2px brand ring, offset). Don't rely on color alone for status (pair color + icon + text on pills).
- Tap targets ≥44px (learning surfaces ≥48px). Keyboard-navigable everywhere; mentor panel and dialogs trap focus correctly.
- `prefers-reduced-motion`: disable joyful/confetti/spring, keep minimal functional fades.

---

## 8. "No AI slop" guardrails (explicit do-not list)
The user specifically asked to avoid "AI slop." Concretely, **do not**:
1. Use purple-on-purple gradient buttons or glossy glassmorphism as the default. (Purple is a category accent only.)
2. Add glowing gradient orbs, neon outer-glows, or animated gradient borders as decoration.
3. Generate busy hero backgrounds with random blobs everywhere. The references use **one** restrained gradient mesh max (public pages only); the app canvas is near-white/calm.
4. Stack five shadows + a border + a gradient on one card. Soft shadow, light border, flat fill. Done.
5. Over-animate. If two things move at once for no reason, cut one.
6. Use fake-3D on every element. The 3D press is **only** the primary button on learning surfaces.
7. Fill space with decorative icons. Every icon means something (category, status, action).
8. Use the word "autopilot" in any copy.
9. Mix more than ~3 accent colors in a single view. Pick the relevant category accents; let green + neutrals carry the rest.
10. Ship low-contrast pastel text. Pastels are backgrounds; text/icons are the saturated ink.

**Litmus again:** *minimal but colorful, instantly legible.* Color earns its place by encoding meaning (category, status, progress). Motion earns its place by clarifying or rewarding. Everything else is removed.

---

## 9. Surface-by-surface application matrix

| Surface | Base reference | Joy layer? | Notes |
|---|---|---|---|
| Public landing / auth | Lumina top-nav, one gradient mesh | Light | Premium, confident; one 3D primary CTA. |
| Onboarding | Edupro warmth | **Yes** | Big rounded option cards, progressive, encouraging, light confetti on finish. |
| Student dashboard | Edupro + Lumina | Medium | Stat rings, streak strip, "next move" hero; track progress is the visual hero. |
| Opportunities catalog | Lumina cards + Lurni filters | Light | Pastel category chips, match-score ring, calm grid. |
| Opportunity detail | Lumina | Light | Clean reading; "why this fits you" reasons. |
| Roadmap | bespoke timeline | **Yes** | Rail fill animation + step-done joy pulse. |
| Courses / lesson / quiz | Edupro + Duolingo | **Yes (full)** | 3D buttons, confetti, XP, streak — the most playful surface. |
| Leaderboard | Edupro | **Yes** | Animated ranks, friendly, never shaming. |
| Certificates / verify | premium/formal | No | Credible, shareable, brand-formal (sponsor-facing). |
| Notifications / email | clean | Light | Branded, legible, single CTA. |
| Admin shell + CRUD | Lurni | **No** | Calm, businesslike, ghost/secondary buttons, data tables, sparkle only on "AI Summary"/ingest. |
| Admin analytics | Lurni + Lumina | Light | Themed charts, count-up stats, focused-bar tooltips. |
| AI Mentor | Linear-calm | Light | One sparkle, streamed text, confirm-chips; no gimmick glow. |

---

## 10. Token starter (drop into `src/app/globals.css` `@theme`)

> This is the canonical starting set the scaffold prompt (Prompt 0) must implement. Values may be tuned, but names are fixed so every later prompt can reference them.

```css
@import "tailwindcss";

@theme {
  /* brand */
  --color-brand: #16A34A;
  --color-brand-strong: #15803D;
  --color-brand-soft: #DCFCE7;
  --color-brand-ring: #86EFAC;

  /* accents (Duolingo secondaries) */
  --color-accent-blue: #1CB0F6;
  --color-accent-deep-blue: #2B70C9;
  --color-accent-yellow: #FFC800;
  --color-accent-orange: #FF9600;
  --color-accent-purple: #CE82FF;
  --color-accent-red: #FF4B4B;
  --color-accent-teal: #14B8A6;

  /* surfaces / neutrals (light) */
  --color-canvas: #F6F8F7;
  --color-surface: #FFFFFF;
  --color-surface-2: #F7F9F8;
  --color-border: #E8ECEA;
  --color-fg: #1A1A1A;
  --color-fg-muted: #6B7280;
  --color-fg-faint: #9CA3AF;

  /* semantic */
  --color-success: #16A34A;
  --color-warning: #FF9600;
  --color-danger: #FF4B4B;
  --color-info: #1CB0F6;

  /* radius */
  --radius-card: 1rem;
  --radius-md: 0.75rem;
  --radius-pill: 9999px;

  /* shadows */
  --shadow-card: 0 1px 2px rgb(16 24 20 / 0.04), 0 8px 24px rgb(16 24 20 / 0.06);
  --shadow-card-hover: 0 2px 4px rgb(16 24 20 / 0.06), 0 14px 32px rgb(16 24 20 / 0.10);
  --shadow-pop: 0 8px 30px rgb(16 24 20 / 0.12);

  /* fonts */
  --font-sans: "Nunito", ui-sans-serif, system-ui, sans-serif;
}

/* dark */
.dark {
  --color-brand: #22C55E;
  --color-brand-strong: #16A34A;
  --color-brand-soft: rgb(20 53 36 / 0.28);
  --color-canvas: #0B0F0E;
  --color-surface: #14201C;
  --color-surface-2: #1B2A25;
  --color-border: #26352F;
  --color-fg: #F3F5F4;
  --color-fg-muted: #9AA5A0;
  --color-fg-faint: #6B7672;
}

/* the Duolingo 3D primary button ledge — utility class */
@layer components {
  .btn-ledge-brand { box-shadow: 0 4px 0 var(--color-brand-strong); }
  .btn-ledge-brand:active { box-shadow: 0 0 0 var(--color-brand-strong); transform: translateY(4px); }
  .btn-ledge-neutral { box-shadow: 0 4px 0 var(--color-border); }
  .btn-ledge-neutral:active { box-shadow: 0 0 0 var(--color-border); transform: translateY(4px); }
}
```

---

## 11. How build-prompts must reference this file
Every Cursor build-prompt that touches UI must include this line near the top:

> **Design:** Follow `DESIGN_SYSTEM.md` exactly. Premium-EdTech base (white rounded-2xl cards on near-white canvas, green primary, pastel icon chips, colored rings, clean Nunito type) + Duolingo joy layer (3D ledge buttons, streak flames, XP count-ups, brief confetti) applied ONLY to learning/gamification surfaces per the §9 matrix. Honor the §8 "no AI slop" list. All colors via tokens (§10), never hardcoded hex. Fully rounded (cards rounded-2xl, pills/buttons rounded-full). Compose from shadcn base-nova + Magic UI / 21st.dev / React Bits; engine logos from @lobehub/icons; never hand-roll UI a library provides.

That sentence + this file is the contract. With it, every screen lands consistent, colorful, minimal, and legible — the Duolingo feel where it matters, the premium-EdTech credibility everywhere else.
