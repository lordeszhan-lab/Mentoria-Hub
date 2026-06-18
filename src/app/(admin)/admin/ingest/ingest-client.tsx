"use client";

/**
 * IngestClient — human-in-the-loop AI ingestion.
 *
 * Flow:
 *  1. Admin pastes raw text → "Extract with AI" → AI extraction call
 *  2. Result pre-fills OpportunityForm
 *  3. Optional dedup warning if cosine similarity > 0.92
 *  4. Admin reviews + saves → embed + insert (no auto-publish)
 */

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Wand2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ingestRawOpportunity } from "@/server/admin/ingest";
import { checkDuplicate, getCategories } from "@/server/admin/opportunities";
import { OpportunityForm } from "@/components/admin/opportunity-form";
import type { CategoryRow } from "@/lib/supabase/types";
import type { OpportunityFormValues } from "@/lib/zod/admin";
import type { IngestDraft } from "@/lib/zod/ingest";

// ── State machine ──────────────────────────────────────────────────────────────

type Step =
  | { kind: "input" }
  | { kind: "extracting" }
  | {
      kind: "review";
      draft: IngestDraft;
      sourceRaw: string;
      categories: CategoryRow[];
      prefill: Partial<OpportunityFormValues>;
      dedup?: { id: string; title: string; similarity: number };
    };

export function IngestClient() {
  const t = useTranslations("admin");
  const [rawText, setRawText] = useState("");
  const [step, setStep] = useState<Step>({ kind: "input" });
  const [isPending, startTransition] = useTransition();

  function handleExtract() {
    if (!rawText.trim()) {
      toast.error("Paste some text first");
      return;
    }
    setStep({ kind: "extracting" });

    startTransition(async () => {
      const result = await ingestRawOpportunity(rawText);

      if ("error" in result) {
        toast.error(result.error);
        setStep({ kind: "input" });
        return;
      }

      const { draft, sourceRaw } = result;

      let categories: CategoryRow[] = [];
      try {
        categories = await getCategories();
      } catch {
        // non-fatal
      }

      let category_id: string | null = null;
      if (draft.category_slug) {
        const cat = categories.find((c) => c.slug === draft.category_slug);
        category_id = cat?.id ?? null;
      }

      const prefill: Partial<OpportunityFormValues> = {
        title: draft.title,
        description: draft.description,
        requirements: draft.requirements ?? null,
        type: draft.type,
        format: draft.format ?? null,
        min_grade: draft.min_grade ?? null,
        max_grade: draft.max_grade ?? null,
        region: draft.region ?? null,
        deadline: draft.deadline ?? null,
        apply_url: draft.apply_url ?? null,
        source: "manual_ai",
        tags: draft.suggested_tags,
        status: "draft",
        category_id,
      };

      let dedup: { id: string; title: string; similarity: number } | undefined;
      try {
        const dupResult = await checkDuplicate(prefill as OpportunityFormValues);
        if (dupResult.isDuplicate && dupResult.match) {
          dedup = dupResult.match;
          toast.warning(
            `Possible duplicate: "${dedup.title}" (${Math.round(dedup.similarity * 100)}% similarity)`,
            { duration: 8000 },
          );
        }
      } catch {
        // non-fatal
      }

      setStep({ kind: "review", draft, sourceRaw, categories, prefill, dedup });
    });
  }

  // ── Input / extracting step ─────────────────────────────────────────────────

  if (step.kind === "input" || step.kind === "extracting") {
    return (
      <div className="space-y-5">

        {/* Textarea */}
        <div>
          <label
            htmlFor="ingest-raw"
            className="block text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-widest"
          >
            {t("rawText")}
          </label>
          <textarea
            id="ingest-raw"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            disabled={step.kind === "extracting"}
            rows={12}
            className="w-full rounded-xl border border-border bg-card px-4 py-3.5 text-sm text-foreground
              placeholder:text-muted-foreground resize-y shadow-sm
              focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40
              disabled:opacity-60 transition-all duration-200"
            placeholder="Paste a raw opportunity announcement here — in any language, any format. The AI will extract the structured data for your review."
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Max 12,000 characters. AI will extract title, description, deadline, type, grade range, and suggest tags.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleExtract}
            disabled={step.kind === "extracting" || !rawText.trim()}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-full bg-primary text-primary-foreground
              text-sm font-semibold shadow-sm hover:bg-primary/90 active:scale-[0.99]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 motion-reduce:transition-none"
          >
            {step.kind === "extracting" ? (
              <>
                <Wand2 size={13} strokeWidth={1.6} className="animate-pulse" aria-hidden />
                {t("extracting")}
              </>
            ) : (
              <>
                <Wand2 size={13} strokeWidth={1.6} aria-hidden />
                {t("extractWithAI")}
              </>
            )}
          </button>
          {step.kind === "extracting" && (
            <p className="text-xs text-muted-foreground">Analyzing the announcement, this takes a few seconds…</p>
          )}
        </div>

        {/* "How it works" card */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            How it works
          </p>
          <p className="text-sm font-semibold text-foreground mb-3">AI-assisted ingestion flow</p>
          <ol className="space-y-2.5">
            {[
              "AI extracts structured fields (title, description, deadline, type, grade range, tags) from pasted text.",
              "A duplicate check runs — if similarity exceeds 92%, a warning appears.",
              "The form is pre-filled for your review. Edit any field freely.",
              "Click \"Create opportunity\" when satisfied. It saves as Draft — never auto-published.",
              "Embedding is computed on save, making it immediately matchable to students.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  // ── Review step ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* AI draft ready banner — green tint, no emoji */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5">
        <CheckCircle2 size={15} strokeWidth={1.6} className="text-primary shrink-0" aria-hidden />
        <p className="text-sm text-foreground flex-1">
          <strong>AI draft ready.</strong> Review all fields below before saving. Nothing has been saved yet.
        </p>
        <button
          type="button"
          onClick={() => setStep({ kind: "input" })}
          className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors shrink-0"
        >
          Start over
        </button>
      </div>

      {/* Dedup warning */}
      {step.dedup && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50">
          <AlertTriangle size={15} strokeWidth={1.6} className="text-amber-600 shrink-0 mt-0.5" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Possible duplicate</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              &ldquo;{step.dedup.title}&rdquo; has{" "}
              {Math.round(step.dedup.similarity * 100)}% similarity.{" "}
              <a
                href={`/admin/opportunities/${step.dedup.id}/edit`}
                className="text-primary hover:underline font-semibold"
              >
                View existing
              </a>{" "}
              or proceed to create a new one below.
            </p>
          </div>
        </div>
      )}

      {/* Pre-filled form */}
      <OpportunityForm
        categories={step.categories}
        prefill={{
          ...step.prefill,
          source: "manual_ai",
          source_raw: step.sourceRaw,
        } as unknown as Partial<OpportunityFormValues>}
      />
    </div>
  );
}
