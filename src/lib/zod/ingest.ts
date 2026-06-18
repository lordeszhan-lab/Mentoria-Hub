import { z } from "zod";
import { OPPORTUNITY_TYPE_VALUES, FORMAT_VALUES } from "./admin";

export const CATEGORY_SLUG_INGEST_VALUES = [
  "business",
  "stem",
  "social-impact",
  "finance",
  "programming",
  "science",
] as const;

/**
 * Schema for AI-extracted opportunity draft.
 * All fields except title and description are nullable — AI must not invent facts.
 */
export const IngestDraftSchema = z.object({
  title: z.string(),
  description: z.string(),
  requirements: z.string().nullable(),
  type: z.enum(OPPORTUNITY_TYPE_VALUES),
  format: z.enum(FORMAT_VALUES).nullable(),
  min_grade: z.number().int().nullable(),
  max_grade: z.number().int().nullable(),
  region: z.string().nullable(),
  deadline: z.string().nullable(),
  category_slug: z.enum(CATEGORY_SLUG_INGEST_VALUES).nullable(),
  suggested_tags: z.array(z.string()),
  apply_url: z.string().nullable(),
});

export type IngestDraft = z.infer<typeof IngestDraftSchema>;
