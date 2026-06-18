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
 * Mentoria's six opportunity categories. Mirrors the role Seobloom's
 * engine-icons played (a shared, typed icon+meta map reused across sections).
 *
 * IMPORTANT: on the monochrome landing these render in `text-foreground`
 * (no per-category color). The pastel accent colors live only in the app
 * dashboard, not on the marketing page.
 */

export type CategoryKey =
  | "stem"
  | "programming"
  | "science"
  | "business"
  | "finance"
  | "social";

export const CATEGORY_ICONS: Record<CategoryKey, LucideIcon> = {
  stem: Atom,
  programming: Code2,
  science: Microscope,
  business: Briefcase,
  finance: LineChart,
  social: HeartHandshake,
};

export interface CategoryMeta {
  key: CategoryKey;
  name: string;
}

export const CATEGORIES_META: CategoryMeta[] = [
  { key: "stem", name: "STEM" },
  { key: "programming", name: "Programming" },
  { key: "science", name: "Science" },
  { key: "business", name: "Business" },
  { key: "finance", name: "Finance" },
  { key: "social", name: "Social Impact" },
];
