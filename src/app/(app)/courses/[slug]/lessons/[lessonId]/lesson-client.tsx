"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Quiz } from "@/components/quiz";
import { markLessonComplete } from "@/server/courses/actions";
import type { QuizQuestion } from "@/server/courses/actions";

// ── XP burst animation ────────────────────────────────────────────────────────

function XpBurst({ xp, onDone }: { xp: number; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -32, scale: 1.2 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={onDone}
      className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white"
      style={{ background: "var(--color-accent-yellow)", boxShadow: "0 2px 8px rgba(255,200,0,0.4)" }}
    >
      <Star size={11} strokeWidth={2} fill="currentColor" />
      +{xp} XP
    </motion.div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface LessonClientProps {
  lessonId: string;
  courseSlug: string;
  questions: QuizQuestion[];
  hasQuiz: boolean;
  initialCompleted: boolean;
  initialQuizPassed: boolean;
  isLastLesson: boolean;
  nextLessonId: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LessonClient({
  lessonId,
  courseSlug,
  questions,
  hasQuiz,
  initialCompleted,
  initialQuizPassed,
  isLastLesson,
  nextLessonId,
}: LessonClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [completed, setCompleted] = useState(initialCompleted);
  const [quizPassed, setQuizPassed] = useState(initialQuizPassed);
  const [showXp, setShowXp] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);

  // Quiz blocks completion unless it exists and hasn't been passed yet.
  const quizBlocksCompletion = hasQuiz && !quizPassed;

  const handleQuizPass = useCallback((xpAwarded?: number) => {
    setQuizPassed(true);
    if (xpAwarded && xpAwarded > 0) {
      setXpAmount(xpAwarded);
      setShowXp(true);
    }
  }, []);

  function fireConfetti() {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#16A34A", "#1CB0F6", "#FFC800", "#FF9600", "#CE82FF"],
      ticks: 80,
    });
  }

  function handleMarkComplete() {
    startTransition(async () => {
      const res = await markLessonComplete(lessonId);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      setCompleted(true);
      setXpAmount(res.xpAwarded ?? 10);
      setShowXp(true);
      fireConfetti();

      if (isLastLesson) {
        toast.success("Course complete! 🎉");
        router.push(`/courses/${courseSlug}/complete`);
      } else if (nextLessonId) {
        toast.success("Lesson complete! Keep going.");
        router.push(`/courses/${courseSlug}/lessons/${nextLessonId}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Quiz (if exists) ── */}
      {hasQuiz && questions.length > 0 && (
        <Quiz
          lessonId={lessonId}
          questions={questions}
          onPass={handleQuizPass}
        />
      )}

      {/* ── Mark complete CTA ── */}
      <div className="relative">
        <AnimatePresence>
          {showXp && (
            <XpBurst xp={xpAmount} onDone={() => setShowXp(false)} />
          )}
        </AnimatePresence>

        {completed ? (
          <div className="flex items-center justify-center gap-2 h-11 rounded-full border border-brand/40 bg-brand-soft text-sm font-semibold text-brand">
            <CheckCircle2 size={15} strokeWidth={2} />
            Lesson complete
          </div>
        ) : (
          <button
            type="button"
            onClick={handleMarkComplete}
            disabled={isPending || quizBlocksCompletion}
            className={[
              "h-11 w-full rounded-full text-sm font-semibold text-white transition-all duration-200",
              !isPending && !quizBlocksCompletion
                ? "bg-brand hover:bg-brand-strong active:scale-[0.99] cursor-pointer"
                : "bg-brand opacity-50 cursor-not-allowed",
            ].join(" ")}
            aria-label="Mark lesson complete"
          >
            {isPending
              ? "Saving…"
              : quizBlocksCompletion
                ? "Pass the quiz to complete"
                : "Mark lesson complete"}
          </button>
        )}
      </div>
    </div>
  );
}
