/** Application-wide constants */

export const APP_NAME = "Mentoria Hub";
export const APP_DESCRIPTION = "EdTech platform for students in grades 8–11";

// ── Gamification: XP amounts ──────────────────────────────────────────────────
export const XP_LESSON_COMPLETED = 20;
export const XP_QUIZ_PASSED = 15;
export const XP_STEP_DONE = 25;
export const XP_OPPORTUNITY_SAVED = 5;
export const XP_COURSE_COMPLETED = 100;

/** Grade range supported */
export const GRADE_MIN = 8;
export const GRADE_MAX = 11;

/** LLM config */
export const LLM_MODEL = "gpt-4o-mini";

/** Category slugs */
export const CATEGORIES = [
  "business",
  "stem",
  "social-impact",
  "finance",
  "programming",
  "science",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Category → design token map */
export const CATEGORY_META: Record<
  Category,
  { label: string; accentVar: string; chipBg: string; ink: string }
> = {
  business: {
    label: "Business",
    accentVar: "--color-accent-orange",
    chipBg: "#FFF1E0",
    ink: "#C2410C",
  },
  stem: {
    label: "STEM",
    accentVar: "--color-accent-deep-blue",
    chipBg: "#E3EDFB",
    ink: "#1E40AF",
  },
  "social-impact": {
    label: "Social Impact",
    accentVar: "--color-accent-teal",
    chipBg: "#D7F5F0",
    ink: "#0F766E",
  },
  finance: {
    label: "Finance",
    accentVar: "--color-accent-yellow",
    chipBg: "#FFF6D6",
    ink: "#A16207",
  },
  programming: {
    label: "Programming",
    accentVar: "--color-accent-blue",
    chipBg: "#E0F4FE",
    ink: "#0369A1",
  },
  science: {
    label: "Science",
    accentVar: "--color-accent-purple",
    chipBg: "#F6E9FF",
    ink: "#7E22CE",
  },
};
