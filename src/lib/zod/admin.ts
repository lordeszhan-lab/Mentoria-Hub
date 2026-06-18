import { z } from "zod";

// ── Shared enums ────────────────────────────────────────────────────────────

export const OPPORTUNITY_TYPE_VALUES = [
  "olympiad",
  "competition",
  "hackathon",
  "scholarship",
  "internship",
  "research",
  "summer_school",
  "volunteering",
  "other",
] as const;

export const FORMAT_VALUES = ["online", "offline", "hybrid"] as const;

export const CONTENT_STATUS_VALUES = [
  "draft",
  "published",
  "archived",
] as const;

export const COURSE_LEVEL_VALUES = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

// ── Opportunity form schema ─────────────────────────────────────────────────

export const OpportunityFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  slug: z.string().min(1).max(300).regex(/^[a-z0-9-]+$/, "Lowercase, digits, and hyphens only").optional(),
  description: z.string().min(1, "Description is required"),
  requirements: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  type: z.enum(OPPORTUNITY_TYPE_VALUES),
  format: z.enum(FORMAT_VALUES).nullable().optional(),
  min_grade: z.number().int().min(8).max(11).nullable().optional(),
  max_grade: z.number().int().min(8).max(11).nullable().optional(),
  region: z.string().max(120).nullable().optional(),
  deadline: z.string().nullable().optional(),
  apply_url: z.string().url("Must be a valid URL").nullable().optional().or(z.literal("")),
  source: z.string().max(120).nullable().optional(),
  tags: z.array(z.string().max(60)).default([]),
  status: z.enum(CONTENT_STATUS_VALUES),
});

export type OpportunityFormValues = z.infer<typeof OpportunityFormSchema>;

// ── Course form schema ──────────────────────────────────────────────────────

export const ContentBlockSchema = z.union([
  z.object({ type: z.literal("heading"), level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(), text: z.string() }),
  z.object({ type: z.literal("paragraph"), text: z.string() }),
  z.object({ type: z.literal("callout"), variant: z.enum(["info", "warning", "tip", "danger"]).optional(), text: z.string() }),
  z.object({ type: z.literal("code"), language: z.string().optional(), code: z.string() }),
  z.object({ type: z.literal("list"), ordered: z.boolean().optional(), items: z.array(z.string()) }),
  z.object({ type: z.literal("divider") }),
]);

export type ContentBlock = z.infer<typeof ContentBlockSchema>;

export const QuizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correct_index: z.number().int().min(0),
  explanation: z.string().optional(),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const LessonFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Lesson title is required").max(200),
  order_index: z.number().int().min(0),
  content: z.array(ContentBlockSchema).default([]),
  video_url: z.string().url().nullable().optional().or(z.literal("")),
  materials: z.any().nullable().optional(),
  quiz: z.array(QuizQuestionSchema).nullable().optional(),
});

export type LessonFormValues = z.infer<typeof LessonFormSchema>;

export const ModuleFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Module title is required").max(200),
  order_index: z.number().int().min(0),
  lessons: z.array(LessonFormSchema).default([]),
});

export type ModuleFormValues = z.infer<typeof ModuleFormSchema>;

export const CourseFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Lowercase, digits, and hyphens only").optional(),
  description: z.string().min(1, "Description is required"),
  level: z.enum(COURSE_LEVEL_VALUES),
  category_id: z.string().uuid().nullable().optional(),
  cover_color: z.string().nullable().optional(),
  estimated_minutes: z.number().int().min(1).nullable().optional(),
  tags: z.array(z.string().max(60)).default([]),
  status: z.enum(CONTENT_STATUS_VALUES),
  modules: z.array(ModuleFormSchema).default([]),
});

export type CourseFormValues = z.infer<typeof CourseFormSchema>;

// ── User role update ────────────────────────────────────────────────────────

export const UserRoleUpdateSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["student", "mentor", "admin"]),
});

export type UserRoleUpdate = z.infer<typeof UserRoleUpdateSchema>;
