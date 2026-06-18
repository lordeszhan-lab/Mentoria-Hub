/**
 * Zod schema for the Roadmap Engine's structured output.
 * Used with OpenAI Structured Outputs (gpt-4o-mini).
 *
 * All nullable fields use .nullable() so the JSON Schema emits
 * `"type": ["...", "null"]` — required for OpenAI strict mode.
 */
import { z } from "zod";

export const RoadmapStepSchema = z.object({
  grade: z.number().int().min(8).max(12),
  term: z.enum(["fall", "spring", "summer"]).nullable(),
  order_index: z.number().int(),
  title: z.string(),
  rationale: z.string(),
  kind: z.enum(["opportunity", "course", "action"]),
  opportunity_id: z.string().nullable(),
  course_id: z.string().nullable(),
  deadline: z.string().nullable(),
  match_score: z.number().min(0).max(100).nullable(),
});

export const RoadmapOutputSchema = z.object({
  goal_summary: z.string(),
  steps: z.array(RoadmapStepSchema),
});

export type RoadmapOutput = z.infer<typeof RoadmapOutputSchema>;
export type RoadmapStepOutput = z.infer<typeof RoadmapStepSchema>;
