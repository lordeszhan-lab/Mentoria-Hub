/**
 * Zod schemas for the recommender system.
 * Used for Structured Outputs validation on the LLM scoring layer.
 */
import { z } from "zod";

// ── Single scored item ────────────────────────────────────────────────────────

export const RecoItemSchema = z.object({
  opportunity_id: z.string(),
  match_score: z.number().min(0).max(100),
  reasons: z.array(z.string()).max(3),
  caution: z.string().nullable(),
});

export type RecoItem = z.infer<typeof RecoItemSchema>;

// ── Full LLM response ─────────────────────────────────────────────────────────

export const RecoOutputSchema = z.object({
  items: z.array(RecoItemSchema),
});

export type RecoOutput = z.infer<typeof RecoOutputSchema>;
