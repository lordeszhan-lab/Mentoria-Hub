"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";
import { submitQuiz } from "@/server/courses/actions";
import type { QuizQuestion, QuizSubmitResult } from "@/server/courses/actions";
import { cn } from "@/lib/utils";

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, passed }: { score: number; passed: boolean }) {
  const size = 96;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = passed ? "var(--color-brand)" : "var(--color-accent-red)";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transformOrigin: "center",
            transform: "rotate(-90deg)",
            transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fontSize="22"
          fontWeight="800"
          fill="var(--color-fg)"
        >
          {score}%
        </text>
      </svg>
      <span
        className="text-xs font-bold"
        style={{ color }}
      >
        {passed ? "Passed!" : "Not yet"}
      </span>
    </div>
  );
}

// ── Question option button ────────────────────────────────────────────────────

interface OptionProps {
  option: { id: string; text: string };
  selected: boolean;
  submitted: boolean;
  isCorrect: boolean | null;
  onSelect: () => void;
}

function OptionButton({ option, selected, submitted, isCorrect, onSelect }: OptionProps) {
  let bg = "var(--color-surface-2)";
  let border = "var(--color-border)";
  let textColor = "var(--color-fg)";

  if (submitted) {
    if (isCorrect) {
      bg = "#DCFCE7";
      border = "var(--color-brand)";
      textColor = "#15803D";
    } else if (selected && !isCorrect) {
      bg = "#FFE4E4";
      border = "var(--color-accent-red)";
      textColor = "#B91C1C";
    }
  } else if (selected) {
    bg = "#DCFCE7";
    border = "var(--color-brand)";
    textColor = "var(--color-brand)";
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={submitted}
      className={cn(
        "relative w-full rounded-2xl border-2 text-left transition-all duration-150",
        "min-h-[48px] px-4 py-3 text-sm font-semibold leading-snug",
        !submitted && "hover:border-[--color-brand] hover:bg-[--color-brand-soft] active:scale-[0.99]",
        submitted && "cursor-default",
      )}
      style={{ background: bg, borderColor: border, color: textColor }}
      aria-pressed={selected}
    >
      <span className="flex items-center gap-3">
        {submitted && isCorrect && (
          <CheckCircle2 className="size-4 shrink-0" strokeWidth={1.8} />
        )}
        {submitted && selected && !isCorrect && (
          <XCircle className="size-4 shrink-0" strokeWidth={1.8} />
        )}
        {option.text}
      </span>
    </button>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface QuizProps {
  lessonId: string;
  questions: QuizQuestion[];
  /** Called when quiz passes; receives XP awarded so the parent can show a burst. */
  onPass?: (xpAwarded: number) => void;
}

// ── Quiz component ────────────────────────────────────────────────────────────

export function Quiz({ lessonId, questions, onPass }: QuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const submitted = result !== null && !result.error;

  function selectOption(questionId: string, optionId: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function handleSubmit() {
    if (!allAnswered) return;
    startTransition(async () => {
      const res = await submitQuiz(lessonId, answers);
      setResult(res);
      if (res.passed) onPass?.(res.xpAwarded ?? 0);
    });
  }

  function handleRetry() {
    setAnswers({});
    setResult(null);
  }

  if (!questions.length) return null;

  return (
    <section
      className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-6 shadow-card"
      aria-label="Lesson quiz"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[--color-fg]">Knowledge check</h2>
          <p className="text-xs text-[--color-fg-muted] mt-0.5">
            Pass 70% or above to complete this lesson.
          </p>
        </div>
        <Trophy className="size-5 text-[--color-accent-yellow] shrink-0" strokeWidth={1.6} />
      </div>

      {/* Results header */}
      <AnimatePresence>
        {submitted && result && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col items-center gap-4 rounded-2xl border border-[--color-border] bg-[--color-surface-2] p-6 text-center"
          >
            <ScoreRing score={result.score ?? 0} passed={result.passed ?? false} />
            <p className="text-sm text-[--color-fg-muted]">
              {result.passed
                ? "Great job! You can mark this lesson complete."
                : "Keep studying and try again — you need 70% to pass."}
            </p>
            {!result.passed && (
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-[--color-surface] border border-[--color-border] text-xs font-bold text-[--color-fg] hover:border-[--color-fg]/30 transition-colors"
              >
                <RotateCcw size={12} strokeWidth={2} />
                Try again
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questions */}
      <div className="space-y-8">
        {questions.map((q, qi) => {
          const questionResult = result?.results?.find((r) => r.questionId === q.id);

          return (
            <div key={q.id}>
              <p className="mb-3 text-sm font-semibold text-[--color-fg]">
                <span className="mr-2 text-[--color-fg-faint]">{qi + 1}.</span>
                {q.text}
              </p>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt.id;
                  const isCorrect = submitted
                    ? opt.id === questionResult?.correctOptionId
                    : null;

                  return (
                    <OptionButton
                      key={opt.id}
                      option={opt}
                      selected={selected}
                      submitted={submitted}
                      isCorrect={isCorrect}
                      onSelect={() => selectOption(q.id, opt.id)}
                    />
                  );
                })}
              </div>

              {/* Per-question explanation after submit */}
              {submitted && questionResult?.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 overflow-hidden rounded-xl border border-[--color-border] bg-[--color-surface-2] px-4 py-3"
                >
                  <p className="text-xs leading-relaxed text-[--color-fg-muted]">
                    <span className="font-semibold text-[--color-fg]">Explanation: </span>
                    {questionResult.explanation}
                  </p>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit button */}
      {!submitted && (
        <div className="mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered || isPending}
            className={cn(
              "h-12 w-full rounded-full text-sm font-bold text-white transition-all duration-75",
              allAnswered && !isPending
                ? "btn-ledge-brand active:translate-y-1 cursor-pointer"
                : "cursor-not-allowed opacity-50",
            )}
            style={{ background: "var(--color-brand)" }}
          >
            {isPending ? "Grading…" : "Submit answers"}
          </button>
          {!allAnswered && (
            <p className="mt-2 text-center text-xs text-[--color-fg-faint]">
              Answer all questions to submit.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
