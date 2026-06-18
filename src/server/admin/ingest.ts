"use server";

import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";
import { LLM_MODEL } from "@/lib/constants";
import { IngestDraftSchema, CATEGORY_SLUG_INGEST_VALUES, type IngestDraft } from "@/lib/zod/ingest";
import { OPPORTUNITY_TYPE_VALUES, FORMAT_VALUES } from "@/lib/zod/admin";

// ── Auth guard ──────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null };

  if (profile?.role !== "admin") redirect("/dashboard");
}

// ── System prompt ───────────────────────────────────────────────────────────
//
// CRITICAL: enum fields MUST be from the exact allowed list.
// The sanitizeAiOutput function also coerces common aliases, but the prompt
// instructs the model to always pick a valid value in the first place.

const SYSTEM_PROMPT = `You are a structured data extractor for an EdTech platform targeting students in grades 8–11 (Kazakhstan).

Extract a structured opportunity from the raw announcement text provided.

STRICT RULES — read carefully:

1. Extract ONLY facts present in the text. Do NOT invent or infer beyond what is stated.

2. "type" MUST be EXACTLY one of these 9 values (no other strings allowed):
   olympiad | competition | hackathon | scholarship | internship | research | summer_school | volunteering | other
   — Math olympiads, science olympiads → "olympiad"
   — Coding/robotics contests, case competitions → "competition"
   — Coding marathons, build weekends → "hackathon"
   — Grant or financial award → "scholarship"
   — Work experience programs → "internship"
   — Academic research programs → "research"
   — Residential/online summer programs → "summer_school"
   — Community service, NGO work → "volunteering"
   — Anything else → "other"

3. "format" MUST be EXACTLY one of: online | offline | hybrid — or null if not stated.

4. "category_slug" MUST be EXACTLY one of these 6 values or null:
   business | stem | social-impact | finance | programming | science

   Mapping guide (use the CLOSEST match — NEVER invent a new category):
   — math, algebra, geometry, calculus, statistics, olympiads, physics, chemistry,
     biology, engineering, robotics, aerospace, medicine, academic competitions,
     science fairs, STEM in general → "stem"
   — natural science research, environmental science, earth science, ecology
     (when NOT obviously math/engineering) → "science"
   — coding, software development, web dev, app dev, cybersecurity,
     competitive programming, hackathons, IT, computer science → "programming"
   — economics, personal finance, investing, financial literacy, FinTech → "finance"
   — entrepreneurship, startups, business case competitions, marketing, MBA-style → "business"
   — volunteering, NGO, community service, social causes, human rights, sustainability → "social-impact"
   — If genuinely ambiguous, pick the closest one. Return null ONLY if no category applies at all.

5. min_grade / max_grade: integer 8–11 or null; infer from age (13-14 y → grade 8, 14-15 y → 9, 15-16 y → 10, 16-17 y → 11) or school year if stated.

6. deadline: ISO 8601 date string YYYY-MM-DD, or null if absent or ambiguous.

7. suggested_tags: 1–5 short keyword tags (e.g. "math", "online", "scholarship", "STEM").

8. apply_url: URL if present, else null.

9. requirements: concise summary of eligibility requirements, or null.

10. region: city/country/area, or null.

11. All text fields should be in the same language as the source text.

Return ONLY valid JSON matching this exact shape — no markdown, no code fences:
{
  "title": "string",
  "description": "string",
  "requirements": "string | null",
  "type": "one of the 9 type values above",
  "format": "online | offline | hybrid | null",
  "min_grade": number | null,
  "max_grade": number | null,
  "region": "string | null",
  "deadline": "YYYY-MM-DD | null",
  "category_slug": "business | stem | social-impact | finance | programming | science | null",
  "suggested_tags": ["string"],
  "apply_url": "string | null"
}`;

// ── Output sanitizer — coerce common AI aliases to valid enum values ─────────
//
// Even with a strict prompt the model may occasionally return aliases.
// This normalizes them so Zod validation never fails on known variations.

const CATEGORY_ALIASES: Record<string, typeof CATEGORY_SLUG_INGEST_VALUES[number]> = {
  // stem aliases
  math: "stem", mathematics: "stem", maths: "stem", algebra: "stem",
  geometry: "stem", calculus: "stem", physics: "stem", chemistry: "stem",
  biology: "stem", engineering: "stem", robotics: "stem", aerospace: "stem",
  medicine: "stem", academic: "stem", olympiad: "stem",
  "natural-science": "stem", "natural science": "stem",
  // science aliases
  ecology: "science", environment: "science", environmental: "science",
  geology: "science", "earth science": "science", astronomy: "science",
  // programming aliases
  coding: "programming", software: "programming", "computer science": "programming",
  "computer-science": "programming", it: "programming", tech: "programming",
  technology: "programming", cybersecurity: "programming", "web development": "programming",
  "app development": "programming", "competitive programming": "programming",
  // finance aliases
  economics: "finance", economy: "finance", investing: "finance",
  financial: "finance", fintech: "finance", "financial literacy": "finance",
  // business aliases
  entrepreneurship: "business", startup: "business", startups: "business",
  marketing: "business", management: "business",
  // social-impact aliases
  volunteering: "social-impact", volunteer: "social-impact", social: "social-impact",
  ngo: "social-impact", community: "social-impact", sustainability: "social-impact",
  "human rights": "social-impact",
};

const TYPE_ALIASES: Record<string, typeof OPPORTUNITY_TYPE_VALUES[number]> = {
  contest: "competition", tournament: "competition", championship: "competition",
  award: "competition", "case competition": "competition",
  "math olympiad": "olympiad", "science olympiad": "olympiad",
  grant: "scholarship", fellowship: "scholarship", bursary: "scholarship",
  "summer program": "summer_school", "summer camp": "summer_school", bootcamp: "summer_school",
  "boot camp": "summer_school", workshop: "summer_school",
  "volunteer program": "volunteering", "community service": "volunteering",
  "work experience": "internship", "work placement": "internship",
  "research program": "research", "research fellowship": "research",
  "coding marathon": "hackathon", sprint: "hackathon",
};

function sanitizeAiOutput(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const obj = { ...(raw as Record<string, unknown>) };

  // Coerce category_slug
  if (typeof obj.category_slug === "string") {
    const lower = obj.category_slug.toLowerCase().trim();
    const validSet = new Set(CATEGORY_SLUG_INGEST_VALUES as unknown as string[]);
    if (!validSet.has(lower)) {
      obj.category_slug = CATEGORY_ALIASES[lower] ?? null;
    }
  }

  // Coerce type
  if (typeof obj.type === "string") {
    const lower = obj.type.toLowerCase().trim();
    const validSet = new Set(OPPORTUNITY_TYPE_VALUES as unknown as string[]);
    if (!validSet.has(lower)) {
      obj.type = TYPE_ALIASES[lower] ?? "other";
    }
  }

  // Coerce format — anything outside the enum becomes null
  if (typeof obj.format === "string") {
    const lower = obj.format.toLowerCase().trim();
    const validSet = new Set(FORMAT_VALUES as unknown as string[]);
    if (!validSet.has(lower)) {
      obj.format = null;
    }
  }

  // Clamp grades to 8–11
  if (typeof obj.min_grade === "number") {
    obj.min_grade = Math.min(11, Math.max(8, Math.round(obj.min_grade)));
  }
  if (typeof obj.max_grade === "number") {
    obj.max_grade = Math.min(11, Math.max(8, Math.round(obj.max_grade)));
  }

  return obj;
}

// ── Main extraction function ─────────────────────────────────────────────────

export async function ingestRawOpportunity(
  rawText: string,
): Promise<
  | { draft: IngestDraft; sourceRaw: string }
  | { error: string }
> {
  await requireAdmin();

  if (!rawText.trim()) {
    return { error: "Raw text is empty" };
  }

  const input = rawText.trim().slice(0, 12000);

  try {
    const completion = await openai.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extract a structured opportunity from this announcement:\n\n${input}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 1200,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return { error: "No response from AI" };

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { error: "AI returned invalid JSON — please try again" };
    }

    // Coerce known aliases before validation so valid values are never rejected
    const sanitized = sanitizeAiOutput(parsed);

    const result = IngestDraftSchema.safeParse(sanitized);
    if (!result.success) {
      // Should be rare after sanitization — show a friendly message, not raw Zod errors
      console.error("[ingest] Validation failed after sanitization:", result.error.issues);
      return {
        error:
          "Could not extract a valid draft from this text. Please check the announcement or fill in the form manually.",
      };
    }

    return { draft: result.data, sourceRaw: rawText };
  } catch (err) {
    console.error("[ingest] Unexpected error:", err);
    return { error: "Extraction failed — please try again" };
  }
}
