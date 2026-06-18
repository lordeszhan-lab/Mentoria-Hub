/**
 * Roadmap generation layer.
 *
 * Single sequential gpt-4o-mini Structured Outputs call.
 * Post-generation validation drops/repairs any fabricated ids.
 * For opportunity steps, catalog deadline always overwrites model's deadline.
 */
import "server-only";

import { zodResponseFormat } from "openai/helpers/zod";
import { openai } from "@/lib/openai/client";
import { RoadmapOutputSchema, type RoadmapOutput } from "@/lib/zod/roadmap";
import type { ProfileRow } from "@/lib/supabase/types";
import type { RoadmapContext } from "./retrieve";

const MODEL = "gpt-4o-mini";

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildSystemPrompt(profile: ProfileRow): string {
  const grade = profile.grade ?? 8;
  const goal = profile.goal?.trim() || "top university admission";
  const locale = (profile as ProfileRow & { locale?: string }).locale ?? "en";
  const localeLabel = locale === "ru" ? "Russian" : locale === "kk" ? "Kazakh" : "English";
  return `You are an expert academic counselor planning a comprehensive multi-year path for a Grade ${grade} student aiming for: ${goal}.

Your task: produce a realistic, progressive SEQUENCE of steps from Grade ${grade} through Grade 12 (the admission year), grouped by grade and term.

LANGUAGE: Write all student-facing text (rationale, goal_summary, step titles) in ${localeLabel} (locale: ${locale}). Use natural, fluent ${localeLabel}. For Kazakh, use correct Kazakh orthography (ә, і, ң, ғ, ү, ұ, қ, ө, h) and avoid Russian calques. For Russian, use correct grammar and a warm, encouraging tone.

Rules:
- Reference ONLY opportunity_ids and course_ids from the provided context. Do NOT invent or guess any IDs.
- For generic preparation steps (skill-building, research, planning, practice), use kind="action" with null ids and null match_score.
- Respect prerequisites and timing: earlier grades build foundations for later steps.
- Assign deadline from context for linked opportunities; set null for action and course steps.
- Write a concrete, student-facing rationale per step (1–2 sentences: why this step, why now).
- match_score (0–100): how well the opportunity or course fits the student's profile; null for action steps.
- Produce 12–20 steps total across all grades; do not exceed 6 steps per grade.
- Order steps within a grade: fall → spring → summer → null.
- goal_summary: 1–2 sentence overview of the overall arc.
- Never hallucinate ids, deadlines, or organizations not present in the provided context.`;
}

function buildUserMessage(profile: ProfileRow, context: RoadmapContext): string {
  const grade = profile.grade ?? 8;
  const goal = profile.goal?.trim() || "top university admission";

  const profileBlock = [
    `Current grade: ${grade}`,
    `Goal: ${goal}`,
    profile.interests?.length ? `Interests: ${profile.interests.join(", ")}` : null,
    profile.subjects?.length ? `Strong subjects: ${profile.subjects.join(", ")}` : null,
    profile.target_majors?.length ? `Target majors: ${profile.target_majors.join(", ")}` : null,
    profile.country ? `Country: ${profile.country}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const oppBlock =
    context.opportunities.length > 0
      ? context.opportunities
          .map((o) => {
            const parts = [
              `id:${o.id}`,
              `title:${o.title}`,
              `type:${o.type}`,
              o.min_grade != null || o.max_grade != null
                ? `grades:${o.min_grade ?? "any"}-${o.max_grade ?? "any"}`
                : null,
              o.deadline ? `deadline:${o.deadline}` : null,
            ]
              .filter(Boolean)
              .join(" | ");
            return `  ${parts}`;
          })
          .join("\n")
      : "  (none available)";

  const courseBlock =
    context.courses.length > 0
      ? context.courses
          .map((c) => `  id:${c.id} | title:${c.title} | level:${c.level}`)
          .join("\n")
      : "  (none available)";

  return `STUDENT PROFILE:
${profileBlock}

AVAILABLE OPPORTUNITIES — use ONLY these ids for opportunity_id:
${oppBlock}

AVAILABLE COURSES — use ONLY these ids for course_id:
${courseBlock}

Plan a complete Grade ${grade} → 12 roadmap sequence for this student.`;
}

// ── Validation + repair ───────────────────────────────────────────────────────

/**
 * Drop or downgrade any step that references a fabricated id.
 * For opportunity steps, overwrite the model's deadline with the real catalog
 * deadline so the calendar always reflects the ground-truth value.
 */
function validateAndRepair(output: RoadmapOutput, context: RoadmapContext): RoadmapOutput {
  const oppMap = new Map(context.opportunities.map((o) => [o.id, o]));
  const courseMap = new Map(context.courses.map((c) => [c.id, c]));

  const repairedSteps = output.steps.map((step) => {
    if (step.opportunity_id != null) {
      const opp = oppMap.get(step.opportunity_id);
      if (!opp) {
        // Fabricated id — downgrade to action step
        console.warn(
          `[roadmap/generate] fabricated opportunity_id="${step.opportunity_id}" — converted to action`,
        );
        return {
          ...step,
          kind: "action" as const,
          opportunity_id: null,
          deadline: null,
          match_score: null,
        };
      }
      // Overwrite model's deadline with the real catalog deadline
      return { ...step, deadline: opp.deadline };
    }

    if (step.course_id != null) {
      const course = courseMap.get(step.course_id);
      if (!course) {
        console.warn(
          `[roadmap/generate] fabricated course_id="${step.course_id}" — converted to action`,
        );
        return {
          ...step,
          kind: "action" as const,
          course_id: null,
          match_score: null,
        };
      }
    }

    return step;
  });

  return { ...output, steps: repairedSteps };
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateRoadmap(
  profile: ProfileRow,
  context: RoadmapContext,
): Promise<{ output: RoadmapOutput } | { error: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return { error: "OPENAI_API_KEY is not configured" };
  }

  try {
    const response = await openai.chat.completions.parse({
      model: MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(profile) },
        { role: "user", content: buildUserMessage(profile, context) },
      ],
      response_format: zodResponseFormat(RoadmapOutputSchema, "roadmap_output"),
      temperature: 0.3,
      max_tokens: 4000,
    });

    const parsed = response.choices[0]?.message?.parsed;

    if (!parsed) {
      const rawContent = response.choices[0]?.message?.content?.slice(0, 300) ?? "(none)";
      console.error("[roadmap/generate] no parsed output", { rawContent });
      return { error: "Model returned no structured output" };
    }

    console.log("[roadmap/generate] raw steps from model:", parsed.steps.length);

    // Validate ids + repair
    const repaired = validateAndRepair(parsed, context);

    console.log("[roadmap/generate] validated steps:", repaired.steps.length);

    return { output: repaired };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[roadmap/generate] OpenAI call failed:", msg);
    return { error: msg };
  }
}
