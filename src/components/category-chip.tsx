"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CATEGORY_MAP, type CategorySlug } from "@/lib/categories";
import { Check } from "lucide-react";

interface CategoryChipProps {
  slug: CategorySlug;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** When true renders as a large rounded-2xl card (onboarding step 3) */
  card?: boolean;
}

/**
 * Reusable selectable category chip.
 * UNSELECTED: white/surface bg + pastel icon + dark text.
 * SELECTED: solid brand-green fill + white icon + white text + green glow.
 */
export function CategoryChip({
  slug,
  selected = false,
  onClick,
  size = "md",
  className,
  card = false,
}: CategoryChipProps) {
  const meta = CATEGORY_MAP[slug];
  if (!meta) return null;

  const { Icon, chipBg, chipInk, name } = meta;

  if (card) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={cn(
          "relative flex flex-col items-center gap-3 rounded-2xl p-5 text-center transition-all duration-200",
          "cursor-pointer select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          selected
            ? "bg-brand border border-brand -translate-y-0.5"
            : "bg-surface border border-border hover:shadow-sm hover:border-fg/20",
          className,
        )}
        style={
          selected
            ? { boxShadow: "0 8px 24px -6px rgba(22, 163, 74, 0.4)" }
            : { boxShadow: "var(--shadow-card)" }
        }
      >
        {selected && (
          <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-white/25">
            <Check size={12} strokeWidth={3} className="text-white" />
          </span>
        )}
        <span
          className="flex size-12 items-center justify-center rounded-xl"
          style={{
            background: selected ? "rgba(255,255,255,0.2)" : `${chipInk}18`,
          }}
        >
          <Icon
            size={26}
            style={{ color: selected ? "#fff" : chipInk }}
            strokeWidth={1.8}
          />
        </span>
        <span
          className="text-sm font-bold leading-tight"
          style={{ color: selected ? "#fff" : "#1A1A1A" }}
        >
          {name}
        </span>
      </motion.button>
    );
  }

  const sizeClasses = {
    sm: "h-7 gap-1.5 px-3 text-xs",
    md: "h-8 gap-2 px-3.5 text-sm",
    lg: "h-10 gap-2 px-4 text-sm",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center rounded-full font-semibold transition-all duration-200",
        "cursor-pointer select-none active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        selected
          ? "bg-brand text-white -translate-y-0.5"
          : "bg-surface border border-border text-fg hover:border-fg/30 hover:shadow-sm",
        sizeClasses[size],
        className,
      )}
      style={
        selected
          ? { boxShadow: "0 8px 24px -6px rgba(22, 163, 74, 0.4)" }
          : undefined
      }
    >
      <Icon
        size={size === "sm" ? 13 : 15}
        style={{ color: selected ? "#fff" : chipInk }}
      />
      {name}
      {selected && <Check size={13} strokeWidth={3} className="ml-0.5" />}
    </button>
  );
}
