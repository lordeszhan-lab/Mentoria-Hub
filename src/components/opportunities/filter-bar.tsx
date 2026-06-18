"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryRow, OpportunityType, Format } from "@/lib/supabase/types";

// ── Facet data ────────────────────────────────────────────────────────────────

const OPPORTUNITY_TYPES: { value: OpportunityType; label: string }[] = [
  { value: "olympiad", label: "Olympiad" },
  { value: "competition", label: "Competition" },
  { value: "hackathon", label: "Hackathon" },
  { value: "scholarship", label: "Scholarship" },
  { value: "internship", label: "Internship" },
  { value: "research", label: "Research" },
  { value: "summer_school", label: "Summer School" },
  { value: "volunteering", label: "Volunteering" },
  { value: "other", label: "Other" },
];

const FORMATS: { value: Format; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "offline", label: "In-person" },
  { value: "hybrid", label: "Hybrid" },
];

const GRADES = [8, 9, 10, 11];

const DEADLINES = [
  { value: "7d", label: "Next 7 days" },
  { value: "30d", label: "Next 30 days" },
  { value: "season", label: "This season" },
];

// ── Public types ──────────────────────────────────────────────────────────────

export interface ActiveFilters {
  q?: string;
  category?: string;
  type?: string;
  format?: string;
  grade?: string;
  deadline?: string;
}

interface FilterBarProps {
  categories: CategoryRow[];
  activeFilters: ActiveFilters;
}

// ── FacetPill — custom styled dropdown ───────────────────────────────────────

interface FacetOption {
  value: string;
  label: string;
}

interface FacetPillProps {
  placeholder: string;
  options: FacetOption[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  align?: "left" | "right";
}

function FacetPill({ placeholder, options, value, onChange, align = "left" }: FacetPillProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isActive = !!value;
  const selectedLabel = options.find((o) => o.value === value)?.label;

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    function handleDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    // `relative` is the positioning root for the absolute dropdown panel.
    // No `isolate` here — the filter bar wrapper (relative z-10 in page.tsx)
    // is the stacking context that keeps dropdowns above the card grid.
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold",
          "transition-all duration-200 select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1",
          isActive
            ? "bg-brand text-white"
            : "bg-[--color-surface] border border-[--color-border] text-[--color-fg-muted]",
          !isActive && "hover:border-[--color-fg]/25 hover:text-[--color-fg] hover:shadow-sm",
        )}
        style={
          isActive
            ? { boxShadow: "0 4px 14px -2px rgba(22,163,74,0.35)" }
            : undefined
        }
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedLabel ?? placeholder}
        <ChevronDown
          size={12}
          strokeWidth={2.5}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            // Animate y-only — no scale — to avoid creating a GPU composite
            // layer that can inherit the parent's backdrop-filter blur.
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "absolute top-full z-50 mt-2 min-w-44 rounded-xl py-1.5",
              "border border-[--color-border]",
              align === "right" ? "right-0" : "left-0",
            )}
            // Use --popover (defined in :root) for a guaranteed solid color that
            // cannot be made transparent by Tailwind's alpha-channel mechanism.
            style={{
              backgroundColor: "var(--popover)",
              boxShadow: "0 8px 30px rgb(16 24 20 / 0.14), 0 2px 8px rgb(16 24 20 / 0.08)",
            }}
          >
            {/* "All" / clear option */}
            <DropdownOption
              label={placeholder}
              isSelected={!isActive}
              onClick={() => { onChange(undefined); setOpen(false); }}
            />
            <div className="mx-3 my-1 h-px bg-[--color-border]" />
            {options.map((opt) => (
              <DropdownOption
                key={opt.value}
                label={opt.label}
                isSelected={value === opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DropdownOption({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-[13px] transition-colors rounded-lg",
        isSelected
          ? "bg-brand/10 text-brand font-bold"
          : "text-[--color-fg] hover:bg-brand/8 hover:text-brand",
      )}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        {isSelected && <Check size={13} strokeWidth={2.5} />}
      </span>
      {label}
    </button>
  );
}

// ── Active chip ───────────────────────────────────────────────────────────────

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="inline-flex items-center gap-1 h-6 pl-3 pr-1.5 rounded-full bg-[--color-brand-soft] text-brand text-[11px] font-bold"
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex size-4 items-center justify-center rounded-full hover:bg-brand/20 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X size={9} strokeWidth={3} />
      </button>
    </motion.span>
  );
}

// ── FilterBar ─────────────────────────────────────────────────────────────────

export function FilterBar({ categories: _categories, activeFilters }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local debounced state for search
  const [searchValue, setSearchValue] = useState(activeFilters.q ?? "");

  useEffect(() => {
    setSearchValue(activeFilters.q ?? "");
  }, [activeFilters.q]);

  const buildUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete("page");
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams],
  );

  // Debounce search → URL (400 ms)
  useEffect(() => {
    const tid = setTimeout(() => {
      const trimmed = searchValue.trim();
      const current = searchParams.get("q") ?? "";
      if (trimmed !== current) {
        router.push(buildUrl({ q: trimmed || undefined }));
      }
    }, 400);
    return () => clearTimeout(tid);
  }, [searchValue, searchParams, router, buildUrl]);

  function setFilter(key: string, value: string | undefined) {
    router.push(buildUrl({ [key]: value }));
  }

  function clearAll() {
    router.push(pathname);
    setSearchValue("");
  }

  const activeCategory = activeFilters.category;
  const hasActiveFilters = !!(
    activeFilters.q ||
    activeFilters.category ||
    activeFilters.type ||
    activeFilters.format ||
    activeFilters.grade ||
    activeFilters.deadline
  );

  return (
    <div
      className="rounded-2xl bg-[--color-surface] px-5 py-4 space-y-3.5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* ── Search ── */}
      <div className="relative">
        <Search
          size={16}
          strokeWidth={1.8}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[--color-fg-muted]"
        />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search opportunities…"
          className={cn(
            "w-full h-11 rounded-full pl-10 pr-10",
            "bg-[--color-canvas] text-sm text-[--color-fg] placeholder:text-[--color-fg-faint]",
            "border border-transparent transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent",
          )}
          style={{ boxShadow: "0 1px 3px rgba(16,24,20,0.06), 0 1px 2px rgba(16,24,20,0.04)" }}
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => { setSearchValue(""); setFilter("q", undefined); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full bg-[--color-border] text-[--color-fg-muted] hover:bg-[--color-fg]/15 transition-colors"
            aria-label="Clear search"
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* ── Category quick-chips ── */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <motion.button
              key={cat.slug}
              type="button"
              onClick={() => setFilter("category", isActive ? undefined : cat.slug)}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold",
                "transition-all duration-200 select-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1",
                isActive
                  ? "bg-brand text-white"
                  : "bg-[--color-surface] border border-[--color-border] text-[--color-fg-muted] hover:border-[--color-fg]/25 hover:text-[--color-fg] hover:shadow-sm",
              )}
              style={
                isActive
                  ? { boxShadow: "0 4px 14px -2px rgba(22,163,74,0.35)" }
                  : undefined
              }
            >
              <cat.Icon
                size={12}
                strokeWidth={1.6}
                style={{ color: isActive ? "#fff" : cat.chipInk }}
                aria-hidden
              />
              {cat.name}
            </motion.button>
          );
        })}
      </div>

      {/* ── Facet pills ── */}
      <div className="flex flex-wrap gap-2">
        <FacetPill
          placeholder="All Types"
          options={OPPORTUNITY_TYPES}
          value={activeFilters.type}
          onChange={(v) => setFilter("type", v)}
        />
        <FacetPill
          placeholder="All Formats"
          options={FORMATS}
          value={activeFilters.format}
          onChange={(v) => setFilter("format", v)}
        />
        <FacetPill
          placeholder="Any Grade"
          options={GRADES.map((g) => ({ value: String(g), label: `Grade ${g}` }))}
          value={activeFilters.grade}
          onChange={(v) => setFilter("grade", v)}
        />
        <FacetPill
          placeholder="Any Deadline"
          options={DEADLINES}
          value={activeFilters.deadline}
          onChange={(v) => setFilter("deadline", v)}
          align="right"
        />
      </div>

      {/* ── Active filter chips ── */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap items-center gap-2 pt-1 overflow-hidden border-t border-[--color-border]"
          >
            <span className="text-[11px] text-[--color-fg-faint] font-medium">Filters:</span>

            <AnimatePresence mode="popLayout">
              {activeFilters.q && (
                <ActiveChip
                  key="q"
                  label={`"${activeFilters.q}"`}
                  onRemove={() => { setSearchValue(""); setFilter("q", undefined); }}
                />
              )}
              {activeFilters.category && (
                <ActiveChip
                  key="cat"
                  label={CATEGORIES.find((c) => c.slug === activeFilters.category)?.name ?? activeFilters.category}
                  onRemove={() => setFilter("category", undefined)}
                />
              )}
              {activeFilters.type && (
                <ActiveChip
                  key="type"
                  label={OPPORTUNITY_TYPES.find((t) => t.value === activeFilters.type)?.label ?? activeFilters.type}
                  onRemove={() => setFilter("type", undefined)}
                />
              )}
              {activeFilters.format && (
                <ActiveChip
                  key="fmt"
                  label={FORMATS.find((f) => f.value === activeFilters.format)?.label ?? activeFilters.format}
                  onRemove={() => setFilter("format", undefined)}
                />
              )}
              {activeFilters.grade && (
                <ActiveChip
                  key="grade"
                  label={`Grade ${activeFilters.grade}`}
                  onRemove={() => setFilter("grade", undefined)}
                />
              )}
              {activeFilters.deadline && (
                <ActiveChip
                  key="dl"
                  label={DEADLINES.find((d) => d.value === activeFilters.deadline)?.label ?? activeFilters.deadline}
                  onRemove={() => setFilter("deadline", undefined)}
                />
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center h-6 px-3 rounded-full text-[11px] font-semibold text-[--color-fg-muted] hover:text-[--color-fg] hover:bg-[--color-canvas] transition-colors"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
