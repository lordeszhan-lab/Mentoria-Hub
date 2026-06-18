/**
 * LLM scoring layer — single gpt-4o-mini Structured Outputs call
 * that scores the top-~10 shortlist from the vector ranking step.
 */
import "server-only";

import { zodResponseFormat } from "openai/helpers/zod";
import { openai } from "@/lib/openai/client";
import { RecoOutputSchema, type RecoItem } from "@/lib/zod/reco";
import type { ProfileRow, OpportunityRow } from "@/lib/supabase/types";
import { recoError, recoLog } from "./log";

// ── Profile summary ───────────────────────────────────────────────────────────

function profileSummary(profile: ProfileRow): string {
  const parts: string[] = [];
  if (profile.grade != null) parts.push(`Grade: ${profile.grade}`);
  if (profile.interests?.length) parts.push(`Interests: ${profile.interests.join(", ")}`);
  if (profile.subjects?.length) parts.push(`Strong subjects: ${profile.subjects.join(", ")}`);
  if (profile.goal) parts.push(`Goal: ${profile.goal}`);
  if (profile.target_majors?.length) parts.push(`Target majors: ${profile.target_majors.join(", ")}`);
  if (profile.country) parts.push(`Country: ${profile.country}`);
  return parts.length > 0 ? parts.join("\n") : "No profile details available.";
}

function oppSummary(opp: OpportunityRow): string {
  const lines: string[] = [
    `ID: ${opp.id}`,
    `Title: ${opp.title}`,
    `Type: ${opp.type}`,
  ];
  if (opp.description) lines.push(`Description: ${opp.description.slice(0, 300)}`);
  if (opp.requirements) lines.push(`Requirements: ${opp.requirements.slice(0, 200)}`);
  if (opp.min_grade != null || opp.max_grade != null) {
    lines.push(`Grade range: ${opp.min_grade ?? "any"}–${opp.max_grade ?? "any"}`);
  }
  if (opp.region) lines.push(`Region: ${opp.region}`);
  if (opp.format) lines.push(`Format: ${opp.format}`);
  if (opp.deadline) lines.push(`Deadline: ${opp.deadline}`);
  if (opp.tags?.length) lines.push(`Tags: ${opp.tags.join(", ")}`);
  return lines.join("\n");
}

function buildSystemPrompt(profile: ProfileRow): string {
  const locale = (profile as ProfileRow & { locale?: string }).locale ?? "en";
  const localeLabel = locale === "ru" ? "Russian" : locale === "kk" ? "Kazakh" : "English";
  return `You are an academic advisor for high-school students in grades 8–11.
Your job is to score how well each opportunity fits a specific student profile.

LANGUAGE: Write all student-facing text (reasons, caution) in ${localeLabel} (locale: ${locale}). Use natural, fluent ${localeLabel}. For Kazakh, use correct Kazakh orthography (ә, і, ң, ғ, ү, ұ, қ, ө, h) and avoid Russian calques. For Russian, use correct grammar and a warm, encouraging tone.

Rules:
- Score each opportunity 0–100 for fit (grade match, interests, subjects, goal alignment).
- Provide 2–3 concrete, specific reasons referencing REAL attributes from the provided data only.
- NEVER invent facts, organizations, deadlines, or requirements not present in the data.
- If you see a potential concern (e.g. grade out of range, language barrier), set caution to a short sentence; otherwise set caution to null.
- Respond with a JSON object matching the required schema exactly.`;
}

const MODEL = "gpt-4o-mini";

/**
 * Score a shortlist of opportunities for a given student profile.
 */
export async function llmScore(
  profile: ProfileRow,
  shortlist: OpportunityRow[],
): Promise<RecoItem[]> {
  if (shortlist.length === 0) {
    recoLog("llmScore", "empty shortlist — skipping LLM call");
    return [];
  }

  const apiKeyPresent = !!process.env.OPENAI_API_KEY;
  const apiKeyPrefix = process.env.OPENAI_API_KEY?.slice(0, 7) ?? "(missing)";

  recoLog("llmScore", "starting LLM call", {
    model: MODEL,
    shortlistCount: shortlist.length,
    shortlistIds: shortlist.map((o) => o.id),
    openaiApiKeyPresent: apiKeyPresent,
    openaiApiKeyPrefix: apiKeyPresent ? `${apiKeyPrefix}…` : null,
    schema: "RecoOutputSchema (caution: z.string().nullable())",
  });

  if (!apiKeyPresent) {
    recoError("llmScore", "OPENAI_API_KEY is not set — cannot score", null);
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const systemPrompt = buildSystemPrompt(profile);
  const userBlock = profileSummary(profile);
  const oppBlocks = shortlist
    .map((o, i) => `--- Opportunity ${i + 1} ---\n${oppSummary(o)}`)
    .join("\n\n");
  const userMessage = `STUDENT PROFILE:\n${userBlock}\n\nOPPORTUNITIES TO SCORE:\n${oppBlocks}`;

  try {
    const response = await openai.chat.completions.parse({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: zodResponseFormat(RecoOutputSchema, "reco_output"),
      temperature: 0.2,
      max_tokens: 1200,
    });

    recoLog("llmScore", "LLM response received", {
      finishReason: response.choices[0]?.finish_reason ?? null,
      usage: response.usage ?? null,
      hasParsed: !!response.choices[0]?.message?.parsed,
      refusal: response.choices[0]?.message?.refusal ?? null,
    });

    const parsed = response.choices[0]?.message?.parsed;

    if (!parsed) {
      recoError("llmScore", "no parsed output from model — using neutral fallback scores", null, {
        rawContent: response.choices[0]?.message?.content?.slice(0, 500) ?? null,
      });
      return shortlist.map((opp) => ({
        opportunity_id: opp.id,
        match_score: 50,
        reasons: ["Match analysis unavailable."],
        caution: null,
      }));
    }

    recoLog("llmScore", "parsed items from LLM", {
      itemCount: parsed.items.length,
      scores: parsed.items.map((i) => ({
        id: i.opportunity_id,
        score: i.match_score,
        reasonCount: i.reasons.length,
      })),
    });

    const llmMap = new Map(parsed.items.map((item) => [item.opportunity_id, item]));

    return shortlist.map((opp) => {
      const llmItem = llmMap.get(opp.id);
      if (llmItem) return llmItem;
      recoLog("llmScore", "LLM omitted opportunity — using fallback", { opportunityId: opp.id });
      return {
        opportunity_id: opp.id,
        match_score: 50,
        reasons: ["Score not available."],
        caution: null,
      };
    });
  } catch (err) {
    recoError("llmScore", "OpenAI Structured Outputs call rejected", err, {
      model: MODEL,
      shortlistCount: shortlist.length,
      hint: "Common causes: invalid API key, schema rejection (missing .nullable()), rate limit",
    });
    throw err;
  }
}
