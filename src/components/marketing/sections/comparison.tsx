"use client";

import { motion } from "motion/react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ease, dur } from "@/lib/motion/tokens";

/**
 * Comparison table. Mirrors Seobloom's desktop-grid + mobile-stacked structure
 * with the highlighted "recommended" column, rebuilt for Mentoria vs the real
 * alternatives a student has today: scattered search/Telegram and private
 * consultants.
 */

type Cell =
  | { type: "yes" }
  | { type: "no" }
  | { type: "partial"; label: string }
  | { type: "text"; label: string };

interface Row {
  label: string;
  mentoria: Cell;
  scattered: Cell;
  consultant: Cell;
}

const ROWS: Row[] = [
  {
    label: "Opportunities matched to your grade & goals",
    mentoria: { type: "yes" },
    scattered: { type: "no" },
    consultant: { type: "partial", label: "If they know" },
  },
  {
    label: "A sequenced, personal roadmap",
    mentoria: { type: "yes" },
    scattered: { type: "no" },
    consultant: { type: "yes" },
  },
  {
    label: "Deadlines tracked + reminders",
    mentoria: { type: "yes" },
    scattered: { type: "no" },
    consultant: { type: "partial", label: "Manual" },
  },
  {
    label: "Courses tied to your opportunities",
    mentoria: { type: "yes" },
    scattered: { type: "no" },
    consultant: { type: "no" },
  },
  {
    label: "Guidance available 24/7",
    mentoria: { type: "yes" },
    scattered: { type: "no" },
    consultant: { type: "no" },
  },
  {
    label: "Cost",
    mentoria: { type: "text", label: "Free to start" },
    scattered: { type: "text", label: "Your hours" },
    consultant: { type: "text", label: "$$$ / hour" },
  },
  {
    label: "Works for KZ + international",
    mentoria: { type: "yes" },
    scattered: { type: "partial", label: "Scattered" },
    consultant: { type: "partial", label: "Varies" },
  },
];

export function ComparisonSection() {
  return (
    <section id="comparison" className="border-y bg-muted/10 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: dur.slow, ease: ease.out }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            vs the alternatives
          </p>
          <h2 className="mt-3 text-[clamp(1.75rem,1.125rem+3.125vw,3rem)] font-extrabold leading-[1.1] tracking-tight">
            A real plan, not a folder of bookmarks.
          </h2>
          <p className="mt-4 text-[15px] text-muted-foreground">
            Searching Telegram and Google scatters opportunities everywhere.
            Private consultants cost more than most families can spend. Mentoria
            gives every student the plan — for free.
          </p>
        </motion.div>

        <div className="mt-16 hidden md:block">
          <ComparisonDesktop />
        </div>
        <div className="mt-12 md:hidden">
          <ComparisonMobile />
        </div>
      </div>
    </section>
  );
}

function ComparisonDesktop() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: dur.slow, ease: ease.out }}
      className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
    >
      <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-b border-border bg-muted/20">
        <div className="px-6 py-6" />
        <div className="relative px-6 py-6 text-center">
          <div
            className="absolute inset-x-2 inset-y-2 -z-0 rounded-lg bg-brand/[0.06]"
            aria-hidden="true"
          />
          <div className="relative">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand">
              Recommended
            </div>
            <div className="mt-1.5 text-[16px] font-semibold tracking-tight">Mentoria Hub</div>
          </div>
        </div>
        <div className="border-l border-border/60 px-6 py-6 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            DIY
          </div>
          <div className="mt-1.5 text-[15px] font-medium tracking-tight text-muted-foreground">
            Telegram / Google
          </div>
        </div>
        <div className="border-l border-border/60 px-6 py-6 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Premium
          </div>
          <div className="mt-1.5 text-[15px] font-medium tracking-tight text-muted-foreground">
            Private consultant
          </div>
        </div>
      </div>

      <div>
        {ROWS.map((row, i) => (
          <ComparisonRow key={i} row={row} index={i} alt={i % 2 === 1} />
        ))}
      </div>
    </motion.div>
  );
}

function ComparisonRow({ row, index, alt }: { row: Row; index: number; alt: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: dur.base, ease: ease.out, delay: index * 0.05 }}
      className={cn(
        "group relative grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center transition-colors",
        alt ? "bg-muted/15" : "bg-background",
        "hover:bg-muted/30",
        index !== 0 && "border-t border-border/60",
      )}
    >
      <div className="px-6 py-5 text-[14px] font-medium text-foreground/90">{row.label}</div>
      <div className="relative flex justify-center px-6 py-5">
        <div className="absolute inset-x-2 inset-y-0 -z-0 bg-brand/[0.06]" aria-hidden="true" />
        <div className="relative">
          <CellContent cell={row.mentoria} highlight />
        </div>
      </div>
      <div className="flex justify-center border-l border-border/60 px-6 py-5">
        <CellContent cell={row.scattered} />
      </div>
      <div className="flex justify-center border-l border-border/60 px-6 py-5">
        <CellContent cell={row.consultant} />
      </div>
    </motion.div>
  );
}

function CellContent({ cell, highlight = false }: { cell: Cell; highlight?: boolean }) {
  switch (cell.type) {
    case "yes":
      return (
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full ring-1 ring-inset transition-transform",
            highlight
              ? "bg-brand text-white ring-brand/20 group-hover:scale-105"
              : "bg-foreground/85 text-background ring-foreground/10",
          )}
          aria-label="Yes"
        >
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      );
    case "no":
      return (
        <span
          className="flex size-7 items-center justify-center rounded-full border border-border bg-background"
          aria-label="No"
        >
          <Minus className="size-3 text-muted-foreground/50" strokeWidth={2.5} />
        </span>
      );
    case "partial":
      return (
        <span className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
          {cell.label}
        </span>
      );
    case "text":
      return (
        <span
          className={cn(
            "font-mono text-[13px] tabular-nums",
            highlight ? "font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          {cell.label}
        </span>
      );
  }
}

function ComparisonMobile() {
  const COLS = [
    {
      id: "mentoria",
      name: "Mentoria Hub",
      eyebrow: "Recommended",
      highlight: true,
      cells: ROWS.map((r) => ({ label: r.label, cell: r.mentoria })),
    },
    {
      id: "scattered",
      name: "Telegram / Google",
      eyebrow: "DIY",
      highlight: false,
      cells: ROWS.map((r) => ({ label: r.label, cell: r.scattered })),
    },
    {
      id: "consultant",
      name: "Private consultant",
      eyebrow: "Premium",
      highlight: false,
      cells: ROWS.map((r) => ({ label: r.label, cell: r.consultant })),
    },
  ];

  return (
    <div className="space-y-5">
      {COLS.map((c, i) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: dur.base, ease: ease.out, delay: i * 0.08 }}
          className={cn(
            "rounded-2xl p-5 shadow-sm",
            c.highlight
              ? "border border-brand/30 bg-brand/[0.04]"
              : "border border-border bg-background",
          )}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {c.eyebrow}
          </p>
          <h3
            className={cn(
              "mt-1 text-[16px] font-semibold tracking-tight",
              !c.highlight && "text-muted-foreground",
            )}
          >
            {c.name}
          </h3>
          <ul className="mt-4 space-y-3">
            {c.cells.map((row, j) => (
              <li
                key={j}
                className="flex items-center justify-between gap-3 border-t border-border/40 pt-3 text-[13px] first:border-t-0 first:pt-0"
              >
                <span className="text-foreground/80">{row.label}</span>
                <span className="shrink-0">
                  <CellContent cell={row.cell} highlight={c.highlight} />
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}
