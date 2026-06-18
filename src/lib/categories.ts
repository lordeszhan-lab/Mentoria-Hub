import {
  Atom,
  Briefcase,
  Code2,
  HeartHandshake,
  LineChart,
  Microscope,
  type LucideIcon,
} from "lucide-react";

/**
 * Category definitions for Mentoria Hub.
 * Accent map per DESIGN_SYSTEM.md §1.2.
 * Reused by onboarding, catalog, roadmap, profile.
 */

export type CategorySlug =
  | "stem"
  | "programming"
  | "science"
  | "business"
  | "finance"
  | "social-impact";

export interface CategoryMeta {
  slug: CategorySlug;
  name: string;
  accentToken: string;
  chipBg: string;
  chipInk: string;
  Icon: LucideIcon;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "business",
    name: "Business",
    accentToken: "--color-accent-orange",
    chipBg: "#FFF1E0",
    chipInk: "#C2410C",
    Icon: Briefcase,
  },
  {
    slug: "stem",
    name: "STEM",
    accentToken: "--color-accent-deep-blue",
    chipBg: "#E3EDFB",
    chipInk: "#1E40AF",
    Icon: Atom,
  },
  {
    slug: "social-impact",
    name: "Social Impact",
    accentToken: "--color-accent-teal",
    chipBg: "#D7F5F0",
    chipInk: "#0F766E",
    Icon: HeartHandshake,
  },
  {
    slug: "finance",
    name: "Finance",
    accentToken: "--color-accent-yellow",
    chipBg: "#FFF6D6",
    chipInk: "#A16207",
    Icon: LineChart,
  },
  {
    slug: "programming",
    name: "Programming",
    accentToken: "--color-accent-blue",
    chipBg: "#E0F4FE",
    chipInk: "#0369A1",
    Icon: Code2,
  },
  {
    slug: "science",
    name: "Science",
    accentToken: "--color-accent-purple",
    chipBg: "#F6E9FF",
    chipInk: "#7E22CE",
    Icon: Microscope,
  },
];

export const CATEGORY_MAP: Record<CategorySlug, CategoryMeta> =
  Object.fromEntries(CATEGORIES.map((c) => [c.slug, c])) as Record<
    CategorySlug,
    CategoryMeta
  >;

/** Fetch categories from Supabase (used by catalog/roadmap server components) */
export async function getCategories() {
  return CATEGORIES;
}
