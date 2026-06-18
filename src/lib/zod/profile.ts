import { z } from "zod";
import type { CategorySlug } from "@/lib/categories";

export const LOCALE_VALUES = ["ru", "en", "kk"] as const;
export type LocaleValue = (typeof LOCALE_VALUES)[number];

export const GRADE_VALUES = [8, 9, 10, 11] as const;
export type GradeValue = (typeof GRADE_VALUES)[number];

export const CATEGORY_SLUG_VALUES = [
  "stem",
  "programming",
  "science",
  "business",
  "finance",
  "social-impact",
] as const satisfies readonly CategorySlug[];

export const SUBJECT_VALUES = [
  "math",
  "english",
  "physics",
  "biology",
  "economics",
  "cs",
  "sat_ielts",
  "university_admissions",
] as const;
export type SubjectValue = (typeof SUBJECT_VALUES)[number];

export const SUBJECT_LABELS: Record<SubjectValue, string> = {
  math: "Math",
  english: "English",
  physics: "Physics",
  biology: "Biology",
  economics: "Economics",
  cs: "CS",
  sat_ielts: "SAT / IELTS Prep",
  university_admissions: "University Admissions",
};

// ── Onboarding schema ──────────────────────────────────────────────────────

export const OnboardingStep1Schema = z.object({
  full_name: z.string().trim().max(120).optional(),
});

export const OnboardingStep2Schema = z.object({
  grade: z.enum(["8", "9", "10", "11"]).transform(Number),
});

export const OnboardingStep3Schema = z.object({
  interests: z
    .array(z.enum(CATEGORY_SLUG_VALUES))
    .min(1, "Select at least one category"),
});

export const OnboardingStep4Schema = z.object({
  subjects: z.array(z.enum(SUBJECT_VALUES)).optional().default([]),
});

export const OnboardingStep5Schema = z.object({
  goal: z.string().trim().max(500).optional(),
});

export const OnboardingFinalSchema = z.object({
  full_name: z.string().trim().max(120).optional(),
  grade: z.number().int().min(8).max(11).optional(),
  interests: z.array(z.enum(CATEGORY_SLUG_VALUES)).min(1),
  subjects: z.array(z.enum(SUBJECT_VALUES)).optional().default([]),
  goal: z.string().trim().max(500).optional(),
});

export type OnboardingFinal = z.infer<typeof OnboardingFinalSchema>;

// ── Profile update schema ──────────────────────────────────────────────────

export const ProfileUpdateSchema = z.object({
  full_name: z.string().trim().max(120).optional(),
  grade: z.number().int().min(8).max(11).optional(),
  locale: z.enum(LOCALE_VALUES).optional(),
  country: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  interests: z.array(z.enum(CATEGORY_SLUG_VALUES)).optional(),
  subjects: z.array(z.enum(SUBJECT_VALUES)).optional(),
  target_majors: z.array(z.string().trim().max(120)).optional(),
  goal: z.string().trim().max(500).optional(),
});

export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
