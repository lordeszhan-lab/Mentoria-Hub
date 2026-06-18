# Mentoria Hub — Cursor Build Pipeline (v2, 23 focused prompts)

> **How to use.** Run prompts **in order**, one at a time, each as a single Cursor task. Paste the fenced `PROMPT` block verbatim. After each prompt, run `npm run typecheck` (every prompt ends with it) and confirm zero errors before the next.
>
> **Two companion design files are the source of truth for all UI:** `DESIGN_SYSTEM.md` (app/dashboard/learning surfaces) and `LANDING_DESIGN.md` (public marketing page). Where a prompt and a design file disagree, the design file wins. Keep both files in the repo root so the agent can read them.
>
> **Global hard conventions (compressed; repeated in each prompt):** Next.js 16.1.6 App Router, all source under `src/`, TypeScript strict. Tailwind v4 + shadcn/ui base-nova. UI priority: shadcn > Magic UI > 21st.dev > React Bits; never hand-roll UI a library provides; engine/brand logos only from `@lobehub/icons`. Supabase (Postgres + pgvector + Auth); auth/routing guard in `src/proxy.ts`, **never** `middleware.ts`. LLM = gpt-4o-mini with Structured Outputs and `.nullable()` on every optional field; **sequential** pipelines, never `Promise.all` over LLM calls. Hosting Vercel, **max 2 cron jobs total**. Email-first delivery (Resend); web push secondary (iOS best-effort); deadlines via subscribed `.ics`. Fully rounded (cards `rounded-2xl`, buttons/pills `rounded-full`); colorful pastel data layer; no flat purple; the word "autopilot" is banned in UI copy; light + dark. `npm run typecheck` passes at the end of every prompt.

---

# PROMPT 1 — Project scaffold + design tokens

```PROMPT
You are building "Mentoria Hub", a web-only EdTech platform for students in grades 8–11. This first task sets up the foundation only; build nothing feature-specific.

HARD CONVENTIONS (apply now and to every future task):
- Next.js 16.1.6 App Router, ALL source under `src/`, TypeScript strict, alias `@/*` -> `src/*`.
- Tailwind v4 + shadcn/ui "base-nova" style.
- UI priority shadcn > Magic UI > 21st.dev > React Bits; never hand-roll UI a library provides; brand/engine logos only from `@lobehub/icons`.
- Supabase for DB + auth (added later). Auth/routing guard MUST live in `src/proxy.ts`, NEVER `middleware.ts`.
- LLM = gpt-4o-mini, Structured Outputs, `.nullable()` on optional fields; sequential, never Promise.all over LLM calls.
- Vercel, MAX 2 cron jobs total.
- Fully rounded (cards rounded-2xl, buttons/pills rounded-full), colorful pastel data layer, NO flat purple, "autopilot" banned in copy, light + dark.

DESIGN: Implement the canonical token set from `DESIGN_SYSTEM.md` §10 exactly (read that file). Brand green is institutional (#16A34A), NOT neon. Accent palette is the Duolingo secondary set. Nunito is the font.

TASKS:
1. Initialize Next.js 16 App Router (TypeScript, `src/`). Configure tsconfig strict + `@/*` alias.
2. Install + configure Tailwind v4. In `src/app/globals.css` add `@import "tailwindcss"` and a `@theme` block with the EXACT tokens from DESIGN_SYSTEM.md §10 (brand, accents, surfaces/neutrals light+dark, semantic, radius, shadows, --font-sans=Nunito). Add the `.btn-ledge-brand` / `.btn-ledge-neutral` component utilities from that file (the Duolingo 3D press).
3. Initialize shadcn/ui base-nova. Generate into `src/components/ui/`: button, card, input, textarea, select, dialog, sheet, tabs, accordion, badge, avatar, dropdown-menu, popover, progress, skeleton, sonner, tooltip, separator, scroll-area, command, switch, checkbox, label, table. Wire the Sonner toaster into the root layout.
4. Install: `@lobehub/icons`, `lucide-react`, `next-themes`, `zod`, `clsx`, `tailwind-merge`, `class-variance-authority`, `framer-motion`. Load Nunito via `next/font/google` (weights 400–900) in the root layout. Create `src/lib/utils.ts` exporting `cn()`.
5. Folder skeleton (with `.gitkeep`): `src/app/(public)/`, `src/app/(app)/`, `src/app/(admin)/`, `src/components/`, `src/components/landing/`, `src/components/ui/`, `src/lib/supabase/`, `src/lib/openai/`, `src/lib/resend/`, `src/lib/zod/`, `src/lib/calendar/`, `src/server/`, plus `src/lib/constants.ts`.
6. ThemeProvider (next-themes, class strategy, default system) in root layout. A `ThemeToggle` component (shadcn dropdown + lucide sun/moon).
7. `src/proxy.ts` as a documented stub: "// Auth + routing guard lives here, NOT middleware.ts. Implemented in the auth task." No logic yet.
8. `.env.example` + `src/lib/env.ts` (zod-validated, fail-fast at import). Keys (empty in example): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, RESEND_API_KEY, EMAIL_FROM, NEXT_PUBLIC_APP_URL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET.
9. A minimal holding page at `src/app/(public)/page.tsx` (just the wordmark + "Coming soon" centered) — the real landing is the next task. Keep it on-brand (Nunito, brand green, rounded).

CONSTRAINTS: no Supabase/auth/LLM/data yet; no DB tables; proxy.ts stays a stub.

FINISH BY running `npm run typecheck` (zero errors). Report the `src/` file tree and confirm tokens match DESIGN_SYSTEM.md §10.
```

---

# PROMPT 2 — Public landing page

```PROMPT
You are continuing "Mentoria Hub". Build the public marketing landing page. Build only the landing (no auth/data yet).

DESIGN: Follow `LANDING_DESIGN.md` exactly and inherit tokens from `DESIGN_SYSTEM.md`. Light, editorial, type-led. Honor the §8 "no AI slop" list in DESIGN_SYSTEM.md. Green `--brand` as the confident accent; Nunito; fully rounded. Compose from shadcn base-nova + Magic UI / 21st.dev / React Bits; never hand-roll UI a library provides.

BUILD these section components under `src/components/landing/` and compose them in `src/app/(public)/page.tsx`:
1. `nav.tsx` — transparent over hero, solid + hairline + soft shadow on scroll (sticky). Left wordmark; center anchors (Product, How it works, For students, For mentors, Pricing); right ghost "Log in" + primary rounded-full "Get started free". Mobile hamburger -> full-screen sheet with CTA pinned bottom.
2. `hero.tsx` — split (desktop ~40% text / ~60% visual; stacks on mobile, text first). Eyebrow pill (brand-soft) -> display headline 800–900, <=2 lines, outcome-led (e.g. "Find every opportunity. Build your roadmap. Get into your dream university.") -> muted subhead (one sentence on HOW) -> CTA row (primary "Start free — no application needed" + ghost "See how it works") -> trust strip directly under CTA. Hero visual = a `rounded-2xl` browser-framed placeholder of the roadmap screen (use a static mock/illustration now; real screenshot later), with at most TWO subtle floating accent chips (a match-score ring, a streak flame). ONE restrained brand gradient-mesh behind the hero only.
3. `trust-bar.tsx` — thin band: credible stat chips (opportunities tracked, roadmaps generated) OR grayscale logos. NO fake logos — use stats if none real.
4. `problem.tsx` — empathetic: 1 headline + 2–3 lines on the chaos of scattered opportunities/missed deadlines/no map. Tight.
5. Feature blocks `feature-catalog.tsx`, `feature-roadmap.tsx` (largest), `feature-courses.tsx`, `feature-mentor.tsx` — alternating left/right: pastel squircle icon + h2 benefit headline + 2–3 outcome sentences + a browser-framed product mock. Scroll-reveal each.
6. `how.tsx` — 3 numbered pastel-chip steps: Tell us your goal -> Get your roadmap -> Follow it step by step.
7. `proof.tsx` — count-up stat cards (catalog size, roadmaps, courses, certificates). NO fake testimonials.
8. `for-mentors.tsx` — short B2B band (institutional face): scaling mentoring + data for schools/sponsors + secondary CTA "For schools & mentors".
9. `pricing.tsx` — DO NOT invent prices. Render a single "Free to start" card + "Contact us for schools" only.
10. `faq.tsx` — shadcn accordion, 5–8 real-objection Q&As (free? grades? KZ+international? data safety? need a mentor already? how is the roadmap made?).
11. `cta.tsx` — full-width soft brand-tinted band: headline + one primary rounded-full CTA + reassurance line.
12. `footer.tsx` — multi-column (product, students, mentors, company, legal privacy/terms), locale switcher RU/EN/KK (visual only now), socials, wordmark + mission, hairline top.

MOTION: meaningful scroll-reveal only (fade + 12–16px rise, once), CTA hover lift, stat count-up on enter. Respect prefers-reduced-motion. No infinite/decorative animation.

PERFORMANCE/SEO: hero headline is TEXT (LCP); hero image = priority `next/image`; one h1 (hero headline) + correct hierarchy; add JSON-LD (Organization + Product); descriptive meta + OpenGraph. Responsive: headline <=2 lines mobile, value prop above fold, hero visual below text on mobile, tap targets >=44px, email field uses type="email".

CONSTRAINTS: no auth/data; placeholder CTAs link to `/auth/login` (route added later) — keep hrefs but they can 404 for now. No stock photos, no AI 3D blobs, no mascot.

FINISH BY `npm run typecheck` (zero errors). Report sections built and confirm the hero matches LANDING_DESIGN.md §2.2.
```

---

# PROMPT 3 — Supabase schema + RLS + seed

```PROMPT
You are continuing "Mentoria Hub". Build the complete database schema, Row Level Security, typed clients, and seed data. No UI in this task. Follow hard conventions.

PART A — CLIENTS
1. Install `@supabase/supabase-js` + `@supabase/ssr`.
2. `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (SSR cookies), `src/lib/supabase/admin.ts` (service-role, `import "server-only"`).
3. `src/lib/supabase/types.ts` — hand-write DB types matching the schema below (so the app is typed before generation). Add npm script `db:types` for `supabase gen types typescript`.

PART B — SCHEMA (SQL migrations under `supabase/migrations/`, timestamped). `uuid` PKs via `gen_random_uuid()`, `created_at`/`updated_at timestamptz default now()`, `create extension if not exists vector`.
Tables (full field lists):
1. `profiles` (id uuid refs auth.users on delete cascade PK; full_name text null; grade int2 check 8..11 null; locale text default 'ru' check in ('ru','en','kk'); country text null; city text null; goal text null; target_majors text[] default '{}'; interests text[] default '{}'; subjects text[] default '{}'; profile_vector vector(1536) null; onboarding_completed bool default false; xp int default 0; streak_count int default 0; streak_last_active date null; calendar_token uuid default gen_random_uuid(); email_optin bool default true; digest_optin bool default true; role text default 'student' check in ('student','mentor','admin')).
2. `categories` (id; slug unique; name_en; name_ru; name_kk; accent_color; icon). 
3. `tags` (id; slug unique; label; kind text in ('subject','format','level','goal','region')).
4. `opportunities` (id; title; slug unique; description; requirements text null; category_id uuid refs categories null; type text in ('olympiad','competition','hackathon','scholarship','internship','research','summer_school','volunteering','other'); format text in ('online','offline','hybrid') null; min_grade int2 null; max_grade int2 null; region text null; deadline timestamptz null; apply_url text null; source text null; source_raw text null; tags text[] default '{}'; embedding vector(1536) null; status text default 'published' check in ('draft','published','archived'); created_by uuid refs profiles null).
5. `saved_opportunities` (id; user_id refs profiles; opportunity_id refs opportunities; unique(user_id,opportunity_id)).
6. `courses` (id; title; slug unique; description; level text in ('beginner','intermediate','advanced'); category_id refs categories null; cover_color text null; estimated_minutes int null; tags text[] default '{}'; status text default 'published').
7. `modules` (id; course_id refs courses on delete cascade; title; order_index int).
8. `lessons` (id; module_id refs modules on delete cascade; title; order_index int; content jsonb; video_url text null; materials jsonb null).
9. `quizzes` (id; lesson_id refs lessons on delete cascade unique; questions jsonb).
10. `enrollments` (id; user_id refs profiles; course_id refs courses; unique(user_id,course_id); enrolled_at timestamptz default now()).
11. `lesson_progress` (id; user_id refs profiles; lesson_id refs lessons; status text default 'not_started' check in ('not_started','in_progress','completed'); quiz_score numeric null; completed_at timestamptz null; unique(user_id,lesson_id)).
12. `roadmaps` (id; user_id refs profiles unique; goal_snapshot text; generated_at timestamptz default now(); model text default 'gpt-4o-mini'; version int default 1).
13. `roadmap_steps` (id; roadmap_id refs roadmaps on delete cascade; grade int2; term text null check in ('fall','spring','summer'); order_index int; title; rationale text; kind text in ('opportunity','course','action'); opportunity_id refs opportunities null; course_id refs courses null; deadline timestamptz null; status text default 'available' check in ('locked','available','in_progress','done'); match_score numeric null).
14. `deadlines` (id; user_id refs profiles; source_type text in ('opportunity','roadmap_step','custom'); source_id uuid null; title; due_at timestamptz; remind_14d_sent bool default false; remind_2d_sent bool default false).
15. `notifications` (id; user_id refs profiles; kind text in ('digest','deadline','system','achievement'); title; body; url text null; read_at timestamptz null; created_at timestamptz default now()).
16. `push_subscriptions` (id; user_id refs profiles; endpoint text; keys jsonb; unique(endpoint)).
17. `certificates` (id; user_id refs profiles; course_id refs courses; serial text unique; issued_at timestamptz default now(); unique(user_id,course_id)).
18. `xp_events` (id; user_id refs profiles; amount int; reason text; created_at timestamptz default now()).
19. `mentors` (id uuid refs profiles PK; bio text null; specialties text[] default '{}').
VECTOR INDEXES: HNSW on `opportunities.embedding` and `profiles.profile_vector` using `vector_cosine_ops`.

PART C — RLS (enable on every table)
- `profiles`: select/update own row; admins select all. A `handle_new_user()` trigger on auth.users inserts a profiles row.
- `categories`,`tags`: public read; write admin only.
- `opportunities`,`courses`,`modules`,`lessons`,`quizzes`: public read where status='published' (always for categories/tags/modules/lessons of published parents — keep simple); write role in ('admin','mentor').
- `saved_opportunities`,`enrollments`,`lesson_progress`,`roadmaps`,`roadmap_steps`,`deadlines`,`notifications`,`push_subscriptions`,`certificates`,`xp_events`: user CRUD only where user_id=auth.uid(); admins read all.
- Service-role bypasses RLS (cron/ingestion).

PART D — SEED (`supabase/seed.sql` or `scripts/seed.ts`): 6 categories (Business/STEM/Social Impact/Finance/Programming/Science) with accent colors + icons matching DESIGN_SYSTEM.md §1.2; ~12 realistic opportunities (mixed types, KZ + international, real-ish deadlines + requirements); 3 courses ("English for Academic Success", "Foundations of Mathematics", "SAT/IELTS Prep"), each 2 modules x 3 lessons, one lesson with a 3-question quiz. All published; embeddings null (filled later). Must read as real.

FINISH BY `npm run typecheck` (zero errors). Confirm migration applies + seed inserts. Report tables, RLS summary, and confirm `handle_new_user` works.
```

---

# PROMPT 4 — Auth (passwordless) + proxy.ts guard

```PROMPT
You are continuing "Mentoria Hub". Implement passwordless authentication and the route guard in `src/proxy.ts`. Follow hard conventions. NO password fields anywhere.

PART A — AUTH SCREENS (under `src/app/(public)/auth/`)
1. `login/page.tsx` — one premium rounded-2xl card (per DESIGN_SYSTEM.md): email input + primary rounded-full "Send magic link"; divider "or"; "Continue with Google" (`@lobehub/icons` Google logo). Sonner toasts ("Check your email" / errors). No password field.
2. `callback/route.ts` — Route Handler: `exchangeCodeForSession`, redirect to `/dashboard` on success, `/auth/login?error=...` on failure.
3. `confirm/route.ts` — handle email OTP / magic-link token verification.

PART B — ACTIONS
- `src/server/auth/actions.ts`: `signInWithMagicLink(email)`, `signInWithGoogle()`, `signOut()`. Use `NEXT_PUBLIC_APP_URL` for redirects.
- Comment clearly: production email goes through Resend (configured later) and the operator must set Supabase custom SMTP (built-in SMTP is rate-limited); handle one-time link expiry + redirect allowlist.

PART C — PROXY GUARD
Rewrite `src/proxy.ts` (the project's middleware-equivalent; do NOT create middleware.ts):
- Refresh the Supabase session each request.
- Protect `(app)` routes (`/dashboard`,`/onboarding`,`/profile`,`/opportunities`,`/courses`,`/roadmap`,`/leaderboard`): unauthenticated -> `/auth/login`.
- Additionally: if authenticated but `onboarding_completed=false`, redirect `(app)` routes (except `/onboarding`) to `/onboarding`.
- Protect `(admin)` routes: require role='admin', else -> `/dashboard`.
- `(public)` open.

FINISH BY `npm run typecheck` (zero errors). Confirm magic-link + Google login flow, callback exchange, and that `src/proxy.ts` (not middleware.ts) enforces the guards. Report the guard logic.
```

---

# PROMPT 5 — Onboarding flow

```PROMPT
You are continuing "Mentoria Hub". Build the student onboarding flow (the profile-vector source). Follow hard conventions and DESIGN_SYSTEM.md (onboarding = JOY layer ON per §9: big rounded option cards, progressive, encouraging, light confetti on finish; "autopilot" banned).

ROUTE: `src/app/(app)/onboarding/page.tsx` (client orchestrator + server action persistence).
STEPS (one screen each; shadcn `progress` indicator; framer-motion transitions; large rounded-2xl option cards):
1. Welcome + name: greeting + optional full_name input + primary rounded-full "Continue".
2. Grade: selectable pill cards 8/9/10/11 (rounded-full, brand accent on select).
3. Interests: multi-select of the 6 categories as pastel cards (each its accent color + icon per DESIGN_SYSTEM.md §1.2). Require >=1.
4. Subjects: multi-select chips (Math, English, Physics, Biology, Economics, CS, SAT/IELTS prep, University Admissions). Optional.
5. Goal: free-text input ("What do you want to achieve? e.g. 'Get into Computer Science at a top university'") + 3 example chips that fill the field.
6. Summary: show selections + primary rounded-full "Generate my profile". On submit: persist, set `onboarding_completed=true`, light confetti, redirect to `/dashboard`.

BEHAVIOR:
- Progressive writes via `src/server/profile/actions.ts: updateOnboarding(partial)` so refresh doesn't lose data.
- If `onboarding_completed` already true, redirect away to `/dashboard`.
- Do NOT compute the profile embedding here. Add `// TODO(prompt-9): embed profile after onboarding`.
- Sonner for success/error.

REUSABLE: `src/components/category-chip.tsx` (pastel, accent-colored, rounded-full, selectable; reused by catalog/roadmap) and `src/lib/categories.ts` (fetch categories + slug->accent/icon map). `src/lib/zod/profile.ts` (onboarding schema: grade 8–11, locale enum, slug arrays).

CONSTRAINTS: no LLM/embeddings; validate all input with zod.

FINISH BY `npm run typecheck` (zero errors). Confirm new user flows through onboarding -> dashboard with `onboarding_completed=true`; refresh mid-flow keeps data. Report steps + files.
```

---

# PROMPT 6 — Profile page

```PROMPT
You are continuing "Mentoria Hub". Build the profile page. Follow hard conventions + DESIGN_SYSTEM.md.

ROUTE: `src/app/(app)/profile/page.tsx`.
- View/edit: full_name, grade, locale (ru/en/kk), country, city, interests (category chips), subjects, target_majors (free tags input), goal.
- `src/server/profile/actions.ts: updateProfile` with zod (`src/lib/zod/profile.ts`). On goal/interests change add `// TODO(prompt-9): re-embed profile on change`.
- Read-only stats: XP + streak as colorful animated stat chips (count-up) — 0 for now.
- "Account" subsection: sign-out (reuse Prompt 4 action) + locale switcher (persist `locale`; add `// TODO(prompt-23): apply locale via i18n`).
- "My certificates" placeholder block: empty state now + `// TODO(prompt-23): list certificates`.

CONSTRAINTS: no LLM/embeddings; zod-validate everything.

FINISH BY `npm run typecheck` (zero errors). Confirm edits persist with validation; XP/streak render. Report files.
```

---

# PROMPT 7 — Opportunities catalog: list, facets, search

```PROMPT
You are continuing "Mentoria Hub". Build the Opportunities Catalog list with server-side faceted filtering + keyword search. Follow hard conventions + DESIGN_SYSTEM.md (catalog = Lumina cards + Lurni filters; pastel category chips; calm grid).

DATA: read `opportunities`,`categories`,`tags` via the server Supabase client. Filtering/search MUST be server-side (URL `searchParams` -> Supabase query), not client-only.

ROUTE: `src/app/(app)/opportunities/page.tsx` (server component reading searchParams).
- Sticky filter bar (rounded-2xl surface) with facets: Category (6 pastel chips), Type (the 9 enum values), Format (online/offline/hybrid), Grade (8–11; match where min_grade<=g<=max_grade or null), Deadline window (7d/30d/this season/any).
- Keyword search input -> `?q=` (debounced), matching title/description. If full-text, add a tsvector index migration.
- Active filters as removable rounded-full chips + "Clear all" pill.
- Results: responsive grid of opportunity cards (component built next prompt — for now render a simple typed card inline OR a stub `OpportunityCard` you will enrich in Prompt 8; keep the data contract stable).
- Skeleton cards while loading; friendly colorful empty state with "Clear filters".
- Pagination/infinite scroll for >20 (Supabase `.range()`).

CONSTRAINTS: no LLM, no match score yet; server-side queries, typed.

FINISH BY `npm run typecheck` (zero errors). Confirm facets + search drive results via URL params; skeleton + empty states work. Report the param/query contract.
```

---

# PROMPT 8 — Opportunity card + detail + favorites

```PROMPT
You are continuing "Mentoria Hub". Build the opportunity card component, the detail page, and favorites. Follow hard conventions + DESIGN_SYSTEM.md.

PART A — CARD `src/components/opportunity-card.tsx`
- rounded-2xl, soft shadow, category accent chip (pastel bg + saturated ink + icon per §1.2).
- Title, type badge, format badge, deadline (relative; urgency color: green >30d, orange 8–30d, red <7d).
- Truncated description.
- A `MatchScoreBadge` slot top-right -> `src/components/match-score-badge.tsx` (given score 0–100 or null: ring + "92% match"; null renders nothing/faint placeholder). Add `// TODO(prompt-11): pass real match score`.
- Save/Saved heart toggle (rounded-full) + "Apply" button (links apply_url, new tab).
- Staggered entrance (framer-motion).
- Wire this card into the Prompt 7 grid (replace any stub).

PART B — DETAIL `src/app/(app)/opportunities/[slug]/page.tsx`
- Full description, requirements, eligibility (grade range), region, format, deadline with an "Add to calendar" button placeholder (`// TODO(prompt-18): wire .ics`), provenance ("Source: ...") subtle.
- Save toggle + Apply CTA.
- "Why this could fit you" section empty for now (`// TODO(prompt-11): explainable match reasons`).

PART C — FAVORITES `src/server/opportunities/actions.ts`
- `toggleSave(opportunityId)` (insert/delete saved_opportunities, RLS-guarded) returning new state; optimistic UI (useOptimistic) + toast.
- `getSavedIds(userId)` helper.

FINISH BY `npm run typecheck` (zero errors). Confirm cards render with accents + urgency; save is optimistic + persists; detail renders. Report files.
```

---

# PROMPT 9 — Embeddings backfill (opportunities + profiles)

```PROMPT
You are continuing "Mentoria Hub". Build the OpenAI client and embeddings backfill. Follow hard conventions. Embeddings model = `text-embedding-3-small` (1536 dims to match the schema). Sequential processing, never Promise.all.

1. `src/lib/openai/client.ts` — OpenAI SDK client, `import "server-only"`.
2. `src/lib/openai/embeddings.ts` — `embedText(text: string): Promise<number[]>` (1536).
3. `src/server/embeddings/opportunities.ts` — embed each published opportunity from a composed string (title + description + requirements + type + category + tags) into `opportunities.embedding`. Idempotent (skip already-embedded unless force). Sequential small batches. Expose `npm run embed:opportunities`.
4. `src/server/embeddings/profile.ts` — `embedProfile(userId)`: compose goal + interests + subjects + grade + target_majors, embed, write `profiles.profile_vector`. WIRE the Prompt 5/6 TODOs: call after onboarding completion and after profile edits (use the existing server actions; fire-and-forget via a void async IIFE so it doesn't block the response).

CONSTRAINTS: server-only; service-role for the backfill job; never expose keys to client.

FINISH BY `npm run typecheck` (zero errors). Confirm opportunities embed via the script and profiles embed on onboarding/profile-change. Report the composed-string format + dims.
```

---

# PROMPT 10 — Recommender: eligibility + pgvector ranking

```PROMPT
You are continuing "Mentoria Hub". Build the first two layers of the recommender: rule-based eligibility + pgvector ranking. (LLM scoring is the next prompt.) Follow hard conventions.

PART A — ELIGIBILITY `src/server/reco/eligibility.ts`
- `filterEligible(profile, opportunities)` — hard filters: grade within [min_grade,max_grade] (nulls pass), region compatible (generous), status='published', deadline future or null. Pure/deterministic, no LLM.

PART B — VECTOR RANKING `src/server/reco/vectorRank.ts`
- Migration: SQL function `match_opportunities(p_vector vector, p_ids uuid[], p_limit int)` using cosine distance (`embedding <=> p_vector`) over the eligible set, returning rows + a normalized similarity 0–1.
- `rankByVector(profileVector, eligibleIds, limit)` calls it. If profile has no vector, fall back to recency/diversity ordering and flag `coldStart: true`.

FINISH BY `npm run typecheck` (zero errors). Confirm eligibility filters correctly and the RPC returns ranked rows; cold-start fallback works. Report the SQL function signature.
```

---

# PROMPT 11 — Recommender: LLM scoring + match-score in UI

```PROMPT
You are continuing "Mentoria Hub". Build the LLM scoring layer and wire real match scores + reasons into the catalog. Follow hard conventions. gpt-4o-mini, Structured Outputs, `.nullable()` on EVERY optional field, single sequential call (do NOT loop per item).

PART A — LLM SCORING `src/server/reco/llmScore.ts`
- Zod schema `src/lib/zod/reco.ts`: `z.object({ items: z.array(z.object({ opportunity_id: z.string(), match_score: z.number().min(0).max(100), reasons: z.array(z.string()).max(3), caution: z.string().nullable() })) })`.
- Input: profile summary + a shortlist (top ~10 from vectorRank). System prompt: act as an academic advisor for grade 8–11; score fit 0–100 vs grade/interests/subjects/goal; 2–3 concrete reasons referencing real opportunity attributes; never invent attributes; ground strictly in provided data. Single call for the whole shortlist.

PART B — ORCHESTRATION `src/server/reco/getRecommendations.ts`
- Sequential pipeline: load profile -> filterEligible -> rankByVector -> llmScore -> return scored, sorted opportunities with reasons. Per-user cache keyed by a profile hash (short TTL) to avoid recompute.

PART C — UI WIRING
- "Recommended for you" section at the top of `/opportunities` (authed + onboarded): top scored opportunities with the REAL `MatchScoreBadge` + reasons on hover/expand. Load this section via Suspense so the base catalog stays fast (don't block on the LLM).
- Fill Prompt 8 TODOs: `MatchScoreBadge` shows real 0–100 with colored ring (green high / amber mid / grey low); detail "Why this could fit you" renders `reasons[]`.
- Cold start: hide badge or show a subtle "Building your matches…" shimmer.

FINISH BY `npm run typecheck` (zero errors). Confirm recommendations show real scores + reasons; cold start handled; base catalog not blocked. Report the pipeline order + schema.
```

---

# PROMPT 12 — Roadmap engine: retrieval + generation

```PROMPT
You are continuing "Mentoria Hub". Build the Roadmap Engine's retrieval + generation (the UI is the next prompt). This is the product centerpiece. Follow hard conventions. gpt-4o-mini, Structured Outputs, `.nullable()`, single sequential generation call. The model must NEVER invent opportunity/course IDs.

CONCEPT: a coherent SEQUENCE (not a list) from the student's current grade through grade 12 (admission year), grouped by grade -> term, each step with a rationale, kind (opportunity|course|action), optional linked real id, optional deadline, match_score.

PART A — RETRIEVAL `src/server/roadmap/retrieve.ts`
- Reuse Prompt 10 eligibility + vectorRank to assemble a relevant shortlist (e.g. top 25 opportunities across remaining grades) + available courses filtered by interests/subjects. Return a compact typed context of REAL catalog ids + key attributes (id, title, type, category, deadline, min/max grade). The model may only reference these ids.

PART B — GENERATION `src/server/roadmap/generate.ts`
- Zod schema `src/lib/zod/roadmap.ts`: `z.object({ goal_summary: z.string(), steps: z.array(z.object({ grade: z.number().int().min(8).max(12), term: z.enum(['fall','spring','summer']).nullable(), order_index: z.number().int(), title: z.string(), rationale: z.string(), kind: z.enum(['opportunity','course','action']), opportunity_id: z.string().nullable(), course_id: z.string().nullable(), deadline: z.string().nullable(), match_score: z.number().min(0).max(100).nullable() })) })`.
- System prompt: expert academic counselor planning a multi-year path for a grade {grade} student aiming for {goal}; realistic progressive sequence across remaining grades; reference ONLY ids from the provided context; for generic steps use kind='action' with null ids; respect prerequisites + timing; concrete rationale per step; never hallucinate ids.
- VALIDATION after return: every non-null opportunity_id/course_id MUST exist in the context — drop/repair any that don't (never persist fabricated ids). For opportunity steps, overwrite the model's deadline with the real catalog deadline.

PART C — PERSISTENCE `src/server/roadmap/save.ts`
- Upsert one `roadmaps` row per user (replace on regenerate, bump `version`); replace `roadmap_steps`. Initial statuses: per-grade first step `available` (keep simple). For each step with a deadline, create/refresh a `deadlines` row (source_type, source_id, title, due_at) for the calendar/reminders.

FINISH BY `npm run typecheck` (zero errors). Confirm generation returns a grounded sequence, ids are validated/repaired, deadlines persist. Report the schema + the id-validation step.
```

---

# PROMPT 13 — Roadmap UI: living timeline + statuses

```PROMPT
You are continuing "Mentoria Hub". Build the Roadmap page UI. Follow hard conventions + DESIGN_SYSTEM.md §5.8 (bespoke vertical timeline; roadmap = JOY layer: rail fill animation + step-done pulse; "autopilot" banned).

ROUTE: `src/app/(app)/roadmap/page.tsx`.
- EMPTY state: premium card + one large primary rounded-full "Generate my roadmap" + a one-line explainer. On click, call the Prompt 12 generate action with a streamed/animated multi-step loading state ("Analyzing your profile… / Matching opportunities… / Sequencing your plan…" — neutral copy).
- POPULATED: a vertical living timeline grouped by grade -> term, connected by a vertical rail. Each step = rounded-2xl card with kind icon (pastel tile), title, rationale ("why"), linked opportunity/course chip (click-through), deadline pill (urgency colored), match-score mini-ring, status control (mark in_progress/done). Staggered reveal; color steps by category accent.
- "Next move" highlight at top: a larger brand-accented, slightly elevated card with a primary CTA — earliest available, not-done step with a near deadline.
- "Regenerate" rounded-full button with a confirm dialog (replaces the plan).

LIVE BEHAVIOR `src/server/roadmap/actions.ts`:
- `setStepStatus(stepId, status)`; when a step is `done`, optionally set the next `locked` step in the same grade to `available` (lightweight, commented). Recompute "next move". Animate rail fill + brief joy pulse on done.
- If profile changed materially, show a subtle "Your profile changed — regenerate?" nudge (no auto-regeneration).

FINISH BY `npm run typecheck` (zero errors). Confirm one button generates a grounded sequenced roadmap; steps link to real items; statuses update + "next move" reflects them. Report the UI structure.
```

---

# PROMPT 14 — Courses: catalog + detail

```PROMPT
You are continuing "Mentoria Hub". Build the course catalog and course detail. Follow hard conventions + DESIGN_SYSTEM.md (courses = JOY layer).

DATA: `courses`,`modules`,`lessons`,`enrollments`,`lesson_progress`.

PART A — CATALOG `src/app/(app)/courses/page.tsx`
- Grid of `src/components/course-card.tsx`: rounded-2xl, category accent cover band, title, level pill, lesson count, estimated minutes, progress ring if enrolled (% lessons complete), primary rounded-full "Enroll"/"Continue". Optional category/level filter (server-side params). Animated grid.

PART B — DETAIL `src/app/(app)/courses/[slug]/page.tsx`
- Header: title, description, level, estimated time, overall progress bar.
- Module list (accordion/sectioned): lessons with completion checkmarks (linear-friendly).
- `src/server/courses/actions.ts: enroll(courseId)` then route to the first incomplete lesson.

FINISH BY `npm run typecheck` (zero errors). Confirm catalog + detail render with progress; enroll routes into a lesson. Report files.
```

---

# PROMPT 15 — Lesson player + quiz

```PROMPT
You are continuing "Mentoria Hub". Build the lesson player and quiz. Follow hard conventions + DESIGN_SYSTEM.md (lesson/quiz = full JOY layer: 3D buttons, big tap targets, instant feedback, confetti on completion).

ROUTE: `src/app/(app)/courses/[slug]/lessons/[lessonId]/page.tsx`.
- `src/components/portable-content.tsx` renders lesson `content` blocks (headings, paragraphs, callouts, code, lists).
- Video area: embed `video_url` if present, else a styled "Video coming soon" rounded-2xl placeholder.
- Materials list (label + external link) if present.
- Primary rounded-full "Mark lesson complete" (3D ledge) -> sets `lesson_progress.status='completed'`, awards XP, updates streak (Prompt 16 wiring; for now call placeholders or insert directly if available). If a quiz exists, require pass (default 70%) before completion counts.
- Prev/Next navigation; finishing the last lesson routes to a course-complete screen with `// TODO(prompt-23): issue certificate`.

QUIZ `src/components/quiz.tsx`:
- Render `questions[]` (single-choice) as big rounded option buttons (tap >=48px). Submit -> `src/server/courses/actions.ts: submitQuiz(lessonId, answers)` computes score SERVER-SIDE from the DB (never trust client), stores `quiz_score`, returns correctness + per-question explanation. Colorful results (score ring, correct/incorrect + explanations), retry allowed.

FINISH BY `npm run typecheck` (zero errors). Confirm play -> (pass quiz) -> complete -> last lesson routes to complete screen; quiz scored server-side. Report files + the pass threshold.
```

---

# PROMPT 16 — Gamification: XP + streak

```PROMPT
You are continuing "Mentoria Hub". Build the gamification layer (XP + learning streak). Follow hard conventions + DESIGN_SYSTEM.md (streak strip per §5.9; encouraging, never shaming). DESIGN NOTE: weight VISIBLE TRACK PROGRESS and "next step" above the streak — streak is a supporting signal, not the hero metric.

`src/server/gamification/actions.ts`:
- `awardXp(userId, amount, reason)` — increments `profiles.xp` AND inserts an `xp_events` row (for weekly leaderboard windows). Amounts in `src/lib/constants.ts`: lesson_completed +20, quiz_passed +15, step_done +25, opportunity_saved +5.
- `touchStreak(userId)` — on any qualifying activity (lesson/quiz/step done): if `streak_last_active`=yesterday -> +1; if today -> no change; else reset to 1; set `streak_last_active`=today. Encouraging framing.
- On milestones (7-day streak, 100 XP) insert an `achievement` notification (table exists) — `// TODO(prompt-20): also send achievement email/push`.
- WIRE these into Prompt 13 (step done) and Prompt 15 (lesson/quiz) completion paths.

UI:
- Animated XP counter + streak flame in the app header (count-up via Magic UI; tabular nums). Streak increment gets a brief celebratory animation (React Bits) — tasteful.
- `src/components/streak-strip.tsx` (7 weekday flames; lit on active days, today emphasized) for the dashboard.

FINISH BY `npm run typecheck` (zero errors). Confirm completing lessons/quizzes/steps awards XP, logs xp_events, updates streak; header counters animate. Report XP/streak rules.
```

---

# PROMPT 17 — Student dashboard

```PROMPT
You are continuing "Mentoria Hub". Build the student dashboard — the command center composing everything so far. Follow hard conventions + DESIGN_SYSTEM.md (Edupro + Lumina; medium joy; TRACK PROGRESS is the visual hero, streak secondary).

ROUTE: `src/app/(app)/dashboard/page.tsx`. Responsive widget grid (rounded-2xl cards, pastel accent headers, tasteful entrance animations, empty states for each):
1. Hero "Next move": earliest available not-done roadmap step with a near deadline + CTA into roadmap/linked item. If no roadmap, a "Generate your roadmap" card linking to /roadmap.
2. My roadmap (compact): next 3–4 steps with status + "Open full roadmap".
3. Active courses: enrolled courses + progress rings + "Continue" into next incomplete lesson.
4. Saved opportunities: favorites as compact cards with deadline urgency.
5. Upcoming deadlines: chronological `deadlines` (next 30d) with urgency color + an "Add to calendar" button + a "Subscribe to calendar" link (wired in Prompt 18 — placeholder now).
6. Recommended for you: top 3 from the Prompt 11 recommender with match scores.
7. Progress & streak: animated XP counter, `streak-strip`, lessons completed, steps done — track progress dominant.

Build a shared app shell `src/components/app-shell.tsx` (sidebar nav per DESIGN_SYSTEM.md §5.6: solid-brand active item; sections; user block; bell; XP+streak in header) wrapping all `(app)` routes via `src/app/(app)/layout.tsx`.

FINISH BY `npm run typecheck` (zero errors). Confirm all 7 widgets render real data + empty states; sidebar shell wraps the app. Report widgets + shell.
```

---

# PROMPT 18 — Calendar export (.ics subscribed feed + add-to-calendar)

```PROMPT
You are continuing "Mentoria Hub". Build the calendar export system (the messenger-reminder replacement). Follow hard conventions + DESIGN_SYSTEM.md.

PART A — SUBSCRIBED FEED (primary)
- Route Handler `src/app/api/calendar/[token]/route.ts` returns `text/calendar` (VCALENDAR) of the user's upcoming deadlines, authenticated BY `profiles.calendar_token` (service-role lookup; 404 on unknown token; the column already exists from Prompt 3).
- Valid VEVENTs: stable UID per deadline id, DTSTART/DTEND (DATE or DATETIME with correct TZID; comment Google's 12–24h refresh lag), SUMMARY (title), DESCRIPTION (link back), TWO VALARMs (−14d, −2d). CRLF line endings + proper escaping. Use the `ics` npm package or hand-build carefully.

PART B — SINGLE-EVENT ADD TO CALENDAR (secondary)
- Per deadline/opportunity: a small menu generating a Google Calendar template URL + a downloadable single `.ics`. Fill the Prompt 8 detail-page `.ics` TODO.

PART C — HELPERS
- `src/lib/calendar/ics.ts`: pure `buildVCalendar(events)`, `buildVEvent(event)`, `googleCalendarUrl(event)`, typed `CalendarEvent`.
- `src/server/deadlines/get.ts`: upcoming deadlines for a user + a token-based variant (service-role) for the feed route.
- Wire the Prompt 17 dashboard "Subscribe to calendar" + "Add to calendar" buttons: copy/link `webcal://.../api/calendar/{token}` (+ https) with the explainer "Your deadlines stay in your own calendar and update automatically. (Google can take up to ~24h to refresh; urgent items also come by email.)"

FINISH BY `npm run typecheck` (zero errors). Confirm subscribing in Google/Apple shows deadlines + reminders; single-event add works; feed 404s on unknown tokens. Report the ICS mapping + token scheme.
```

---

# PROMPT 19 — Email delivery (Resend: digests + triggers)

```PROMPT
You are continuing "Mentoria Hub". Build email delivery via Resend (the PRIMARY retention channel). Follow hard conventions + DESIGN_SYSTEM.md (clean, branded, single CTA, plain-text fallback).

1. `src/lib/resend/client.ts` (server-only). Comment: operator must verify the domain (SPF/DKIM/DMARC) and set this as Supabase custom SMTP too.
2. Templates (React Email or typed HTML) in `src/lib/resend/templates/`:
   - `digest.tsx` — weekly "New opportunities for you": top 3–5 recommended opportunities (match score + 1 reason each), upcoming deadlines (next 14d), a roadmap nudge ("Your next move: …"), single CTA, unsubscribe link. Plain-text fallback.
   - `deadline.tsx` — "Deadline in {N} days: {title}" + apply link + add-to-calendar link.
   - `achievement.tsx` — "You hit a {N}-day streak / {X} XP", light.
3. `src/server/notifications/email.ts` — `sendDigest(userId)`, `sendDeadlineReminder(deadlineId, window)`, `sendAchievement(userId, payload)`. Each composes data server-side, sends via Resend, AND inserts a `notifications` row (mirrors in-app). Honor `profiles.email_optin`/`digest_optin`.
4. WIRE the Prompt 16 achievement TODO to call `sendAchievement` on milestones.

CONSTRAINTS: email-first; honor opt-ins; reuse Prompt 11 reco output for the digest (no new LLM call needed).

FINISH BY `npm run typecheck` (zero errors). Confirm digest/deadline/achievement emails render + send via Resend and mirror to notifications. Report templates + opt-in handling.
```

---

# PROMPT 20 — Web push + in-app notifications + the 2 crons

```PROMPT
You are continuing "Mentoria Hub". Build web push (secondary), the in-app notification center, and EXACTLY TWO Vercel cron jobs (the project-wide maximum). Follow hard conventions. Email stays primary; web push is Android/desktop + installed-PWA only; do NOT rely on iOS push.

PART A — WEB PUSH (secondary)
- `src/lib/push/webpush.ts` using `web-push` (server-only; VAPID keys from env).
- Client `usePushSubscription` hook + an "Enable notifications" affordance shown only where supported (on iOS only after PWA install — else show guidance). Persist subscriptions in `push_subscriptions`.
- `src/server/notifications/push.ts: sendPush(userId, payload)` iterates subscriptions, prunes dead endpoints (404/410). Used as a SUPPLEMENT to email for deadlines/achievements.
- Add `push`/`notificationclick` handlers to a `public/sw.js` stub (`// TODO(prompt-23): finalize SW caching`).

PART B — IN-APP CENTER
- Bell in the app header with unread count (`notifications.read_at is null`). A shadcn sheet/popover lists notifications (kind icon, title, body, relative time, link). Mark-as-read on open + "mark all read".
- `src/server/notifications/actions.ts: markRead(id)`, `markAllRead()`.

PART C — CRONS (EXACTLY TWO) in `vercel.json`, Route Handlers under `src/app/api/cron/`, guarded by a `CRON_SECRET` header check, idempotent:
1. `/api/cron/deadlines` (hourly/every few hours): scan `deadlines` due in ~14d and ~2d where the respective sent flag is false; send deadline email (+ optional push), insert notifications, flip flags.
2. `/api/cron/digest` (weekly, Mon AM): for each opted-in user, compose + send the weekly digest (+ notification). Batch SEQUENTIALLY in chunks (respect Resend limits; never Promise.all a blast).
DO NOT add a third cron anywhere.

FINISH BY `npm run typecheck` (zero errors). Confirm push works on a supported browser; in-app center mirrors notifications; exactly two secret-guarded idempotent crons exist. Report the two schedules + opt-in handling.
```

---

# PROMPT 21 — Admin shell + opportunities/courses CRUD

```PROMPT
You are continuing "Mentoria Hub". Build the Admin area shell and CRUD for opportunities + courses. Follow hard conventions + DESIGN_SYSTEM.md (admin = NO joy layer: calm, businesslike, Lurni; ghost/secondary buttons; data tables; sparkle only on AI features). `(admin)` is guarded by `src/proxy.ts` (role='admin').

PART A — SHELL `src/app/(admin)/layout.tsx`
- Sidebar (Lurni style): sections Dashboard, Opportunities, Courses, Users, Ingest. Utilitarian but on-brand.

PART B — OPPORTUNITIES CRUD
- `(admin)/opportunities` (table: search/filter/status), `(admin)/opportunities/new`, `(admin)/opportunities/[id]/edit`.
- Typed form (zod `src/lib/zod/admin.ts`) for all fields incl. deadline date-time picker + tags chips + status.
- `src/server/admin/opportunities.ts`: create/update/archive/delete. On create/update, (re)compute the embedding (reuse `embedText`) so it's immediately matchable. No site rebuild needed — changes are live. Optimistic table + toasts.

PART C — COURSES CRUD (lighter)
- `(admin)/courses` table + create/edit form for course metadata + a nested editor for modules/lessons (title, order, content blocks, optional video_url, materials) + optional quiz editor (questions, options, correct index, explanation). Store the same portable JSON the Prompt 15 renderer expects.

FINISH BY `npm run typecheck` (zero errors). Confirm admin can CRUD opportunities/courses live (no rebuild) with embedding recompute. Report files.
```

---

# PROMPT 22 — Admin: AI ingestion + dedup + analytics

```PROMPT
You are continuing "Mentoria Hub". Build AI-assisted ingestion, embedding dedup, and admin analytics. Follow hard conventions. gpt-4o-mini, Structured Outputs, `.nullable()`, single sequential extraction call. Human-in-the-loop: AI drafts, human approves — NEVER auto-publish.

PART A — INGEST `(admin)/ingest`
- Large textarea: "Paste a raw opportunity announcement…" + "Extract" button.
- `src/server/admin/ingest.ts: ingestRawOpportunity(rawText)` — single gpt-4o-mini call, Structured Outputs. Zod `src/lib/zod/ingest.ts`: `z.object({ title: z.string(), description: z.string(), requirements: z.string().nullable(), type: z.enum([...types]), format: z.enum(['online','offline','hybrid']).nullable(), min_grade: z.number().int().nullable(), max_grade: z.number().int().nullable(), region: z.string().nullable(), deadline: z.string().nullable(), category_slug: z.string().nullable(), suggested_tags: z.array(z.string()) })`. System prompt: extract a structured opportunity for grades 8–11 from messy text; infer category from the 6 slugs; parse deadline to ISO (null if absent/ambiguous); don't invent facts; preserve `source_raw=rawText`, `source='manual_ai'`.
- Return the parsed draft as a PRE-FILLED editable opportunity form (NOT auto-published). Admin reviews -> Save -> embed + insert.
- DEDUP: embed the candidate, run a pgvector similarity check (reuse the Prompt 10 match RPC pattern); if cosine > threshold, warn with the match + let admin merge/skip.

PART B — ANALYTICS `(admin)/dashboard`
- Animated stat cards (count-up): total users, active (7/30d via lesson_progress/streak), total opportunities/courses, completion rate per course, students with a deadline in 7d, most-saved opportunities. Server-side SQL aggregates. A Recharts chart (signups over time or completions), themed to tokens (rounded bars, brand colors, focused-bar tooltip per DESIGN_SYSTEM.md §5.7).
- `(admin)/users`: paginated table (email, role, grade, xp, last active); guarded role-change action (student/mentor/admin).

FINISH BY `npm run typecheck` (zero errors). Confirm pasting raw text yields an editable structured draft; dedup warns on near-duplicates; analytics render real aggregates. Report the ingestion schema + dedup threshold.
```

---

# PROMPT 23 — Certificates + leaderboard + i18n + PWA + AI Mentor

```PROMPT
You are continuing "Mentoria Hub". Final task: certificates, leaderboard, i18n (RU/EN/KK), PWA finalization, and the AI Mentor. Follow hard conventions + DESIGN_SYSTEM.md. gpt-4o-mini, Structured Outputs + `.nullable()` for structured returns, sequential.

PART A — CERTIFICATES (verifiable + shareable)
- Fill the Prompt 15 TODO: on course completion, `issueCertificate(userId, courseId)` (idempotent; unique `serial`).
- Public `src/app/(public)/verify/[serial]/page.tsx` (no auth): branded premium certificate (name, course, date, Mentoria branding, "Verified"). Shareable/LinkedIn-ready.
- Fill the Prompt 6 "My certificates" block: list earned certs + "Share" (copy verify link / LinkedIn URL) + optional downloadable image/PDF (link at minimum).

PART B — LEADERBOARD `src/app/(app)/leaderboard/page.tsx`
- Weekly + all-time XP (rank, avatar, name, XP) using `xp_events` for weekly windows. Animated rows, current user highlighted, friendly/encouraging tone (never shaming).

PART C — I18N (RU/EN/KK)
- Add `next-intl` (consistent with Next 16). Externalize UI strings to `messages/ru.json`,`/en.json`,`/kk.json` (default ru). Respect `profiles.locale`; fill the Prompt 6 locale-switcher TODO (persist + apply). Locale-aware date/deadline formatting. UI CHROME ONLY — opportunity/course content stays in its source language (no machine translation of content).

PART D — PWA
- Manifest (`src/app/manifest.ts`): name, short_name, maskable icons, theme/background, display 'standalone', start_url '/dashboard'.
- Finalize `public/sw.js` (Prompt 20 stub): cache app shell + viewed opportunity/course content for offline reading; network-first for data, cache-first for static; keep push/notificationclick handlers.
- Installability: tasteful "Install app" on Android/desktop; on iOS show "Add to Home Screen" guidance. Do NOT promise push on iOS.

PART E — AI MENTOR (flagship)
- Floating rounded-full launcher (brand, ONE tasteful sparkle — no glowing-orb AI slop) across the app + inline in lessons ("Ask the mentor about this lesson"). Opens a shadcn sheet panel per DESIGN_SYSTEM.md §5.10.
- `src/app/api/mentor/route.ts` — streaming chat. Assemble CONTEXT server-side per message: profile (grade/interests/goal), roadmap steps (titles/statuses/next move), current course/lesson if any, and relevant catalog snippets via RAG (reuse Prompt 12 retrieval). System prompt: a Mentoria academic mentor for a grade {grade} student aiming for {goal}; encouraging, concrete, safe, age-appropriate; reference the student's actual roadmap/progress; only reference REAL opportunities/courses from context; no medical/financial/legal advice beyond general guidance. Stream tokens.
- If the mentor proposes an action (save opportunity / mark step done), it MAY return a small structured suggestion (Structured Outputs, `.nullable()`) rendered as a one-tap confirm — the mentor NEVER mutates data silently. Context assembly server-side; never leak the service-role key.

FINISH BY `npm run typecheck` (zero errors). Then run a FULL end-to-end smoke test and report it: new user -> magic-link login -> onboarding -> dashboard -> generate roadmap (grounded, sequenced) -> open opportunity (real match score + reasons) -> save -> subscribe to .ics -> open course -> complete lesson + pass quiz -> XP + streak -> finish course -> certificate issued + verify page -> leaderboard reflects XP -> switch locale -> install PWA -> ask AI Mentor (context-aware streamed answer) -> (admin) paste raw text -> AI extracts editable opportunity -> save live. Confirm every hard convention held (src/, proxy.ts not middleware.ts, rounded-2xl/rounded-full, no flat purple, <=2 crons, Structured Outputs + .nullable(), sequential LLM, email-first, DESIGN_SYSTEM.md + LANDING_DESIGN.md followed).
```

---

## Appendix — Cron budget (max 2) & LLM call ledger
**Crons:** `/api/cron/deadlines` (hourly-ish; 14d + 2d reminders) and `/api/cron/digest` (weekly). No third cron — fold any new need into these.
**LLM calls (all gpt-4o-mini, Structured Outputs, `.nullable()`, sequential):** reco scoring (Prompt 11), roadmap generation (Prompt 12), raw ingestion (Prompt 22), mentor chat + optional action (Prompt 23). Embeddings: `text-embedding-3-small` 1536 (Prompt 9).

## Appendix — Top failure modes to catch
1. `middleware.ts` appears -> delete, move to `src/proxy.ts`. 2. Missing `.nullable()` on optional Structured-Output fields -> runtime validation fail. 3. `Promise.all` over LLM calls -> rate/cost spikes. 4. LLM invents opportunity/course ids -> validate against context, repair. 5. Embedding dim mismatch (must be 1536). 6. Client-side catalog filtering -> must be server-side. 7. Auto-publishing AI-ingested items -> human-in-the-loop only. 8. Promising push on iOS -> email + .ics are the reliable channels. 9. >2 crons. 10. Service-role key leaking to client -> keep engine code in `src/server/` + `import "server-only"`. 11. Daily-streak as hero metric -> track progress is the hero. 12. Skipping the typecheck gate. 13. Trusting client quiz scores -> score server-side. 14. Broken `.ics` (CRLF/escaping/TZID).
