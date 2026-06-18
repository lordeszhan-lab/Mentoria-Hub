"use client";

/**
 * OpportunityForm — shared form for create and edit.
 * Admin design: calm, businesslike (ghost/secondary buttons, no joy layer).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  OPPORTUNITY_TYPE_VALUES,
  FORMAT_VALUES,
  CONTENT_STATUS_VALUES,
  type OpportunityFormValues,
} from "@/lib/zod/admin";
import type { CategoryRow, OpportunityRow } from "@/lib/supabase/types";
import { createOpportunity, updateOpportunity } from "@/server/admin/opportunities";

// ── Label ──────────────────────────────────────────────────────────────────────

function Label({ htmlFor, children, optional }: { htmlFor: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-[--color-fg-muted] mb-1.5 uppercase tracking-wide">
      {children}
      {optional && <span className="ml-1 font-normal text-[--color-fg-faint]">(optional)</span>}
    </label>
  );
}

// ── Field wrapper ──────────────────────────────────────────────────────────────

function Field({ children, error }: { children: React.ReactNode; error?: string }) {
  return (
    <div>
      {children}
      {error && <p className="mt-1 text-xs text-[--color-accent-red]">{error}</p>}
    </div>
  );
}

// ── Input styles ───────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-xl border border-[--color-border] bg-[--color-surface] px-3 py-2 text-sm text-[--color-fg] placeholder-[--color-fg-faint] focus:outline-none focus:ring-2 focus:ring-[--color-brand]/30 focus:border-[--color-brand]/60 transition";
const selectCls = "w-full rounded-xl border border-[--color-border] bg-[--color-surface] px-3 py-2 text-sm text-[--color-fg] focus:outline-none focus:ring-2 focus:ring-[--color-brand]/30 focus:border-[--color-brand]/60 transition";

// ── Tags chip input ────────────────────────────────────────────────────────────

function TagsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput("");
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 min-h-[40px] rounded-xl border border-border bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-primary/25 focus-within:border-primary/40 transition-all duration-200"
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 h-6 px-2.5 rounded-full text-xs font-semibold bg-primary/10 text-primary"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="hover:opacity-70 transition-opacity"
            aria-label={`Remove ${tag}`}
          >
            <X size={10} strokeWidth={2.5} aria-hidden />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "," || e.key === " ") {
            e.preventDefault();
            addTag(input);
          }
          if (e.key === "Backspace" && !input && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={value.length === 0 ? "Type a tag and press Enter…" : ""}
        className="flex-1 min-w-[120px] text-sm text-[--color-fg] placeholder-[--color-fg-faint] bg-transparent outline-none border-none"
      />
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-[--color-fg-faint] pt-5 pb-1 border-b border-[--color-border]">
      {children}
    </h2>
  );
}

// ── Main form ──────────────────────────────────────────────────────────────────

export interface OpportunityFormProps {
  categories: CategoryRow[];
  initial?: Partial<OpportunityRow>;
  /** If provided, we're in edit mode */
  editId?: string;
  /** Pre-filled from AI ingest — all values are suggestions */
  prefill?: Partial<OpportunityFormValues>;
}

export function OpportunityForm({
  categories,
  initial,
  editId,
  prefill,
}: OpportunityFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [values, setValues] = useState<OpportunityFormValues>(() => ({
    title: prefill?.title ?? initial?.title ?? "",
    description: prefill?.description ?? initial?.description ?? "",
    requirements: prefill?.requirements ?? initial?.requirements ?? null,
    category_id: prefill?.category_id ?? initial?.category_id ?? null,
    type: prefill?.type ?? initial?.type ?? "competition",
    format: prefill?.format ?? initial?.format ?? null,
    min_grade: prefill?.min_grade ?? initial?.min_grade ?? null,
    max_grade: prefill?.max_grade ?? initial?.max_grade ?? null,
    region: prefill?.region ?? initial?.region ?? null,
    deadline: prefill?.deadline ?? (initial?.deadline ? initial.deadline.slice(0, 16) : null),
    apply_url: prefill?.apply_url ?? initial?.apply_url ?? null,
    source: prefill?.source ?? initial?.source ?? null,
    tags: prefill?.tags ?? initial?.tags ?? [],
    status: prefill?.status ?? initial?.status ?? "draft",
  }));

  const [errors, setErrors] = useState<Partial<Record<keyof OpportunityFormValues, string>>>({});

  function set<K extends keyof OpportunityFormValues>(key: K, val: OpportunityFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof OpportunityFormValues, string>> = {};
    if (!values.title.trim()) errs.title = "Title is required";
    if (!values.description.trim()) errs.description = "Description is required";
    if (values.apply_url && !/^https?:\/\//.test(values.apply_url)) {
      errs.apply_url = "Must start with http:// or https://";
    }
    if (
      values.min_grade != null &&
      values.max_grade != null &&
      values.min_grade > values.max_grade
    ) {
      errs.max_grade = "Max grade must be ≥ min grade";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      const payload: OpportunityFormValues = {
        ...values,
        requirements: values.requirements || null,
        apply_url: values.apply_url || null,
        region: values.region || null,
        deadline: values.deadline || null,
        source: values.source || null,
      };

      if (editId) {
        const result = await updateOpportunity(editId, payload);
        if (result && "error" in result) {
          toast.error(result.error);
        } else {
          toast.success("Opportunity updated");
          router.push("/admin/opportunities");
        }
      } else {
        const result = await createOpportunity(payload);
        if ("error" in result) {
          toast.error(result.error);
        } else {
          toast.success("Opportunity created");
          router.push("/admin/opportunities");
        }
      }
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">

      <SectionHeading>Core</SectionHeading>

      <Field error={errors.title}>
        <Label htmlFor="opp-title">Title</Label>
        <input
          id="opp-title"
          type="text"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          className={inputCls}
          placeholder="e.g. STEM Olympiad Kazakhstan 2025"
          required
        />
      </Field>

      <Field error={errors.description}>
        <Label htmlFor="opp-desc">Description</Label>
        <textarea
          id="opp-desc"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          className={inputCls}
          placeholder="Full description of the opportunity…"
        />
      </Field>

      <Field error={errors.requirements}>
        <Label htmlFor="opp-req" optional>Requirements</Label>
        <textarea
          id="opp-req"
          value={values.requirements ?? ""}
          onChange={(e) => set("requirements", e.target.value || null)}
          rows={3}
          className={inputCls}
          placeholder="Eligibility criteria…"
        />
      </Field>

      <SectionHeading>Classification</SectionHeading>

      <div className="grid grid-cols-2 gap-4">
        <Field error={errors.type}>
          <Label htmlFor="opp-type">Type</Label>
          <select
            id="opp-type"
            value={values.type}
            onChange={(e) => set("type", e.target.value as OpportunityFormValues["type"])}
            className={selectCls}
          >
            {OPPORTUNITY_TYPE_VALUES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </Field>

        <Field error={errors.format}>
          <Label htmlFor="opp-format" optional>Format</Label>
          <select
            id="opp-format"
            value={values.format ?? ""}
            onChange={(e) =>
              set("format", (e.target.value as OpportunityFormValues["format"]) || null)
            }
            className={selectCls}
          >
            <option value="">— Any —</option>
            {FORMAT_VALUES.map((f) => (
              <option key={f} value={f}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <Label htmlFor="opp-category" optional>Category</Label>
          <select
            id="opp-category"
            value={values.category_id ?? ""}
            onChange={(e) => set("category_id", e.target.value || null)}
            className={selectCls}
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </select>
        </Field>

        <Field error={errors.status}>
          <Label htmlFor="opp-status">Status</Label>
          <select
            id="opp-status"
            value={values.status}
            onChange={(e) => set("status", e.target.value as OpportunityFormValues["status"])}
            className={selectCls}
          >
            {CONTENT_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <SectionHeading>Eligibility</SectionHeading>

      <div className="grid grid-cols-3 gap-4">
        <Field error={errors.min_grade}>
          <Label htmlFor="opp-min-grade" optional>Min Grade</Label>
          <input
            id="opp-min-grade"
            type="number"
            min={8}
            max={11}
            value={values.min_grade ?? ""}
            onChange={(e) => set("min_grade", e.target.value ? parseInt(e.target.value) : null)}
            className={inputCls}
            placeholder="8"
          />
        </Field>

        <Field error={errors.max_grade}>
          <Label htmlFor="opp-max-grade" optional>Max Grade</Label>
          <input
            id="opp-max-grade"
            type="number"
            min={8}
            max={11}
            value={values.max_grade ?? ""}
            onChange={(e) => set("max_grade", e.target.value ? parseInt(e.target.value) : null)}
            className={inputCls}
            placeholder="11"
          />
        </Field>

        <Field>
          <Label htmlFor="opp-region" optional>Region</Label>
          <input
            id="opp-region"
            type="text"
            value={values.region ?? ""}
            onChange={(e) => set("region", e.target.value || null)}
            className={inputCls}
            placeholder="e.g. Almaty, Online"
          />
        </Field>
      </div>

      <SectionHeading>Dates & Links</SectionHeading>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <Label htmlFor="opp-deadline" optional>Deadline</Label>
          <input
            id="opp-deadline"
            type="datetime-local"
            value={values.deadline ?? ""}
            onChange={(e) => set("deadline", e.target.value || null)}
            className={inputCls}
          />
        </Field>

        <Field error={errors.apply_url}>
          <Label htmlFor="opp-url" optional>Apply URL</Label>
          <input
            id="opp-url"
            type="url"
            value={values.apply_url ?? ""}
            onChange={(e) => set("apply_url", e.target.value || null)}
            className={inputCls}
            placeholder="https://…"
          />
        </Field>
      </div>

      <Field>
        <Label htmlFor="opp-source" optional>Source</Label>
        <input
          id="opp-source"
          type="text"
          value={values.source ?? ""}
          onChange={(e) => set("source", e.target.value || null)}
          className={inputCls}
          placeholder="e.g. manual, kazobr.kz"
        />
      </Field>

      <SectionHeading>Tags</SectionHeading>

      <Field>
        <Label htmlFor="opp-tags" optional>Tags</Label>
        <TagsInput value={values.tags} onChange={(tags) => set("tags", tags)} />
      </Field>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center h-9 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 active:scale-[0.99] disabled:opacity-60 transition-all duration-200 motion-reduce:transition-none"
        >
          {isPending
            ? editId
              ? "Saving…"
              : "Creating…"
            : editId
            ? "Save changes"
            : "Create opportunity"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/opportunities")}
          className="inline-flex items-center h-9 px-4 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
