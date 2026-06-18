"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  Compass,
  Rocket,
  GraduationCap,
  BookOpen,
  Target,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryChip } from "@/components/category-chip";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import {
  SUBJECT_VALUES,
  SUBJECT_LABELS,
  type SubjectValue,
} from "@/lib/zod/profile";
import { updateOnboarding, completeOnboarding } from "@/server/profile/actions";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface OnboardingState {
  full_name: string;
  grade: number | null;
  interests: CategorySlug[];
  subjects: SubjectValue[];
  goal: string;
}

const TOTAL_STEPS = 6;

// ── Motion variants ────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 56 : -56,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -56 : 56,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.65, 0, 0.35, 1] as const },
  }),
};

// ── Confetti cannons ───────────────────────────────────────────────────────

function fireConfettiCannons() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) return;
  const end = Date.now() + 800;
  const colors = ["#16A34A", "#1CB0F6", "#FFC800", "#FF9600"];
  function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      startVelocity: 55,
      origin: { x: 0, y: 1 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      startVelocity: 55,
      origin: { x: 1, y: 1 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  }
  frame();
}

// ── Grade pill ─────────────────────────────────────────────────────────────

function GradePill({
  grade,
  selected,
  onClick,
  gradeLabel,
}: {
  grade: number;
  selected: boolean;
  onClick: () => void;
  gradeLabel: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        "flex h-16 w-24 flex-col items-center justify-center rounded-2xl font-extrabold text-xl transition-all duration-200 cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        selected
          ? "bg-brand text-white -translate-y-0.5"
          : "bg-surface border border-border text-fg hover:border-fg/30 hover:shadow-sm",
      )}
      style={
        selected
          ? { boxShadow: "0 8px 24px -6px rgba(22, 163, 74, 0.4)" }
          : { boxShadow: "var(--shadow-card)" }
      }
    >
      <span className="text-2xl">{grade}</span>
      <span className={cn("text-xs font-semibold", selected ? "text-white/70" : "text-fg-muted")}>
        {gradeLabel}
      </span>
    </motion.button>
  );
}

// ── Subject chip ───────────────────────────────────────────────────────────

function SubjectChip({
  subject,
  selected,
  onClick,
}: {
  subject: SubjectValue;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        "inline-flex items-center rounded-full px-4 h-9 text-sm font-semibold transition-all duration-200 cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        selected
          ? "bg-brand text-white -translate-y-0.5"
          : "bg-surface border border-border text-fg hover:border-fg/30 hover:shadow-sm",
      )}
      style={
        selected
          ? { boxShadow: "0 8px 24px -6px rgba(22, 163, 74, 0.4)" }
          : undefined
      }
    >
      {SUBJECT_LABELS[subject]}
    </motion.button>
  );
}

// ── Step header ────────────────────────────────────────────────────────────

function StepHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon?: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 text-center">
      {Icon && (
        <div className="mb-4 mx-auto flex size-12 items-center justify-center rounded-full bg-brand-soft">
          <Icon
            size={22}
            strokeWidth={1.6}
            className="text-brand"
          />
        </div>
      )}
      <h1 className="text-3xl font-extrabold text-fg leading-tight tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-sm text-fg-muted">{subtitle}</p>
      )}
    </div>
  );
}

// ── Primary button ─────────────────────────────────────────────────────────

function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
  className,
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const tCommon = useTranslations("common");
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "h-12 w-full rounded-full bg-brand text-white font-semibold shadow-sm",
        "transition-all hover:bg-brand-strong active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      )}
    >
      {loading ? tCommon("loading") : children}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);

  const [state, setState] = useState<OnboardingState>({
    full_name: "",
    grade: null,
    interests: [],
    subjects: [],
    goal: "",
  });

  const progress = Math.round(((step - 1) / TOTAL_STEPS) * 100);

  const goNext = useCallback(
    async (partial?: Partial<OnboardingState>, finalStep = false) => {
      setSaving(true);
      try {
        const payload = partial ?? {};
        const result = finalStep
          ? await completeOnboarding({
              full_name: state.full_name || undefined,
              grade: state.grade ?? undefined,
              interests: state.interests,
              subjects: state.subjects,
              goal: state.goal || undefined,
            })
          : await updateOnboarding({
              full_name: (payload.full_name ?? state.full_name) || undefined,
              grade: payload.grade ?? state.grade ?? undefined,
              interests: (payload.interests ?? state.interests).length > 0
                ? (payload.interests ?? state.interests)
                : undefined,
              subjects: (payload.subjects ?? state.subjects).length > 0
                ? (payload.subjects ?? state.subjects)
                : undefined,
              goal: (payload.goal ?? state.goal) || undefined,
            });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        if (finalStep) {
          fireConfettiCannons();
          toast.success("Profile created! Welcome to Mentoria.");
          setTimeout(() => {
            router.push("/dashboard");
          }, 1400);
          return;
        }

        setDir(1);
        setStep((s) => s + 1);
      } finally {
        setSaving(false);
      }
    },
    [state, router],
  );

  const goBack = useCallback(() => {
    if (step <= 1) return;
    setDir(-1);
    setStep((s) => s - 1);
  }, [step]);

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">

      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-canvas/90 backdrop-blur-sm px-4 pt-4 pb-3">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-3 mb-3">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                aria-label={t("step", { current: step - 1, total: TOTAL_STEPS })}
                className="flex size-8 items-center justify-center rounded-full hover:bg-border transition-colors text-fg-muted"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <span className="ml-auto text-xs font-semibold text-fg-muted">
              {t("step", { current: step, total: TOTAL_STEPS })}
            </span>
          </div>
          <Progress value={progress} />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 overflow-hidden">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              {step === 1 && (
                <Step1
                  fullName={state.full_name}
                  onChange={(v) => setState((s) => ({ ...s, full_name: v }))}
                  onNext={() => goNext({ full_name: state.full_name })}
                  saving={saving}
                />
              )}
              {step === 2 && (
                <Step2
                  grade={state.grade}
                  onChange={(v) => setState((s) => ({ ...s, grade: v }))}
                  onNext={() => goNext({ grade: state.grade ?? undefined })}
                  saving={saving}
                />
              )}
              {step === 3 && (
                <Step3
                  interests={state.interests}
                  onToggle={(slug) =>
                    setState((s) => ({
                      ...s,
                      interests: toggle(s.interests, slug),
                    }))
                  }
                  onNext={() => goNext({ interests: state.interests })}
                  saving={saving}
                />
              )}
              {step === 4 && (
                <Step4
                  subjects={state.subjects}
                  onToggle={(s) =>
                    setState((prev) => ({
                      ...prev,
                      subjects: toggle(prev.subjects, s),
                    }))
                  }
                  onNext={() => goNext({ subjects: state.subjects })}
                  saving={saving}
                />
              )}
              {step === 5 && (
                <Step5
                  goal={state.goal}
                  onChange={(v) => setState((s) => ({ ...s, goal: v }))}
                  onNext={() => goNext({ goal: state.goal })}
                  saving={saving}
                />
              )}
              {step === 6 && (
                <Step6
                  state={state}
                  onSubmit={() => goNext(undefined, true)}
                  saving={saving}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Welcome + name ─────────────────────────────────────────────────

function Step1({
  fullName,
  onChange,
  onNext,
  saving,
}: {
  fullName: string;
  onChange: (v: string) => void;
  onNext: () => void;
  saving: boolean;
}) {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  return (
    <div>
      <StepHeader
        title={t("welcomeTitle")}
        subtitle={t("welcomeSubtitle")}
      />
      <div
        className="rounded-2xl bg-surface p-6 mb-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="full_name" className="text-sm font-semibold">
            {t("yourName")} <span className="text-fg-faint">({tCommon("optional")})</span>
          </Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="given-name"
            placeholder={t("namePlaceholder")}
            value={fullName}
            onChange={(e) => onChange(e.target.value)}
            maxLength={120}
            className="rounded-full h-11 px-4 border-border bg-surface-2 focus-visible:ring-brand"
          />
        </div>
      </div>
      <PrimaryButton onClick={onNext} loading={saving}>
        {tCommon("continue")} →
      </PrimaryButton>
    </div>
  );
}

// ── Step 2: Grade ──────────────────────────────────────────────────────────

function Step2({
  grade,
  onChange,
  onNext,
  saving,
}: {
  grade: number | null;
  onChange: (v: number) => void;
  onNext: () => void;
  saving: boolean;
}) {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  return (
    <div>
      <StepHeader
        icon={GraduationCap}
        title={t("gradeTitle")}
        subtitle={t("gradeSubtitle")}
      />
      <div
        className="rounded-2xl bg-surface p-6 mb-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex justify-center gap-4 flex-wrap">
          {([8, 9, 10, 11] as const).map((g) => (
            <GradePill
              key={g}
              grade={g}
              selected={grade === g}
              onClick={() => onChange(g)}
              gradeLabel={tCommon("grade")}
            />
          ))}
        </div>
      </div>
      <PrimaryButton onClick={onNext} disabled={grade === null} loading={saving}>
        {tCommon("continue")} →
      </PrimaryButton>
    </div>
  );
}

// ── Step 3: Interests ──────────────────────────────────────────────────────

function Step3({
  interests,
  onToggle,
  onNext,
  saving,
}: {
  interests: CategorySlug[];
  onToggle: (slug: CategorySlug) => void;
  onNext: () => void;
  saving: boolean;
}) {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  return (
    <div>
      <StepHeader
        icon={Compass}
        title={t("interestsTitle")}
        subtitle={t("interestsSubtitle")}
      />
      <div
        className="rounded-2xl bg-surface p-5 mb-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.slug}
              slug={cat.slug}
              selected={interests.includes(cat.slug)}
              onClick={() => onToggle(cat.slug)}
              card
            />
          ))}
        </div>
      </div>
      <PrimaryButton
        onClick={onNext}
        disabled={interests.length === 0}
        loading={saving}
      >
        {tCommon("continue")} →
      </PrimaryButton>
      {interests.length === 0 && (
        <p className="mt-2 text-center text-xs text-fg-muted">
          {t("selectAtLeastOne")}
        </p>
      )}
    </div>
  );
}

// ── Step 4: Subjects ───────────────────────────────────────────────────────

function Step4({
  subjects,
  onToggle,
  onNext,
  saving,
}: {
  subjects: SubjectValue[];
  onToggle: (s: SubjectValue) => void;
  onNext: () => void;
  saving: boolean;
}) {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  return (
    <div>
      <StepHeader
        icon={BookOpen}
        title={t("subjectsTitle")}
        subtitle={t("subjectsSubtitle")}
      />
      <div
        className="rounded-2xl bg-surface p-5 mb-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex flex-wrap gap-2.5">
          {SUBJECT_VALUES.map((s) => (
            <SubjectChip
              key={s}
              subject={s}
              selected={subjects.includes(s)}
              onClick={() => onToggle(s)}
            />
          ))}
        </div>
      </div>
      <PrimaryButton onClick={onNext} loading={saving}>
        {tCommon("continue")} →
      </PrimaryButton>
    </div>
  );
}

// ── Step 5: Goal ───────────────────────────────────────────────────────────

function Step5({
  goal,
  onChange,
  onNext,
  saving,
}: {
  goal: string;
  onChange: (v: string) => void;
  onNext: () => void;
  saving: boolean;
}) {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  return (
    <div>
      <StepHeader
        icon={Target}
        title={t("goalTitle")}
        subtitle={t("goalSubtitle")}
      />
      <div
        className="rounded-2xl bg-surface p-5 mb-4"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <Textarea
          placeholder={t("goalPlaceholder")}
          value={goal}
          onChange={(e) => onChange(e.target.value)}
          maxLength={500}
          rows={3}
          className="resize-none rounded-2xl border-border bg-surface-2 focus-visible:ring-brand text-sm"
        />
      </div>
      <PrimaryButton onClick={onNext} loading={saving}>
        {tCommon("continue")} →
      </PrimaryButton>
    </div>
  );
}

// ── Step 6: Summary ────────────────────────────────────────────────────────

function Step6({
  state,
  onSubmit,
  saving,
}: {
  state: OnboardingState;
  onSubmit: () => void;
  saving: boolean;
}) {
  const t = useTranslations("onboarding");
  return (
    <div>
      <StepHeader
        title={t("summaryTitle")}
        subtitle={t("summarySubtitle")}
      />

      <div
        className="rounded-2xl bg-surface divide-y divide-border mb-6 overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {state.full_name && (
          <SummaryRow label={t("labelName")} value={state.full_name} />
        )}
        {state.grade && (
          <SummaryRow label={t("labelGrade")} value={`${state.grade}`} />
        )}
        <SummaryRow
          label={t("labelInterests")}
          value={
            state.interests.length > 0
              ? state.interests.join(", ")
              : "—"
          }
        />
        {state.subjects.length > 0 && (
          <SummaryRow
            label={t("labelSubjects")}
            value={state.subjects
              .map((s) => SUBJECT_LABELS[s])
              .join(", ")}
          />
        )}
        {state.goal && <SummaryRow label={t("labelGoal")} value={state.goal} />}
      </div>

      <PrimaryButton onClick={onSubmit} loading={saving} className="gap-2">
        <Rocket size={16} className="inline-block mr-1" />
        {t("generateProfile")}
      </PrimaryButton>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 px-5 py-3.5">
      <span className="min-w-24 text-xs font-semibold text-fg-muted uppercase tracking-wide mt-0.5">
        {label}
      </span>
      <span className="text-sm text-fg font-medium leading-relaxed">
        {value}
      </span>
    </div>
  );
}
