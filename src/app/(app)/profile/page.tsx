"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { setLocale } from "@/server/locale/actions";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User,
  GraduationCap,
  Globe,
  Target,
  BookOpen,
  Award,
  LogOut,
  Plus,
  X,
  Flame,
  Zap,
  ExternalLink,
} from "lucide-react";
import { useInView } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryChip } from "@/components/category-chip";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import {
  SUBJECT_VALUES,
  SUBJECT_LABELS,
  LOCALE_VALUES,
  type SubjectValue,
  type LocaleValue,
} from "@/lib/zod/profile";
import {
  getProfile,
  updateProfile,
} from "@/server/profile/actions";
import { getCertificates } from "@/server/courses/certificates";
import { signOut } from "@/server/auth/actions";
import { cn } from "@/lib/utils";
import type { ProfileRow, CertificateRow } from "@/lib/supabase/types";

// ── Count-up stat chip ─────────────────────────────────────────────────────

function StatChip({
  icon: Icon,
  label,
  value,
  color,
  chipBg,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  chipBg: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView || value === 0) return;
    const startTime = performance.now();
    const duration = 800;
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <div
      ref={ref}
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{ background: chipBg }}
    >
      <div
        className="flex size-10 items-center justify-center rounded-xl"
        style={{ background: `${color}25` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div
          className="text-2xl font-extrabold tabular-nums leading-none"
          style={{ color }}
        >
          {displayed.toLocaleString()}
        </div>
        <div className="text-xs font-semibold mt-0.5" style={{ color: `${color}CC` }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ── Section card ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-2xl bg-[--color-surface] p-5", className)}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        {Icon && (
          <div className="flex size-7 items-center justify-center rounded-lg bg-[--color-brand-soft]">
            <Icon size={15} className="text-[--color-brand]" />
          </div>
        )}
        <h2 className="text-base font-bold text-[--color-fg]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Field row ──────────────────────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-[--color-fg-muted]">{label}</Label>
      {children}
    </div>
  );
}

// ── Tag input (target majors) ──────────────────────────────────────────────

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && draft.trim()) {
      e.preventDefault();
      const tag = draft.trim().replace(/,$/, "");
      if (tag && !tags.includes(tag)) onAdd(tag);
      setDraft("");
    }
    if (e.key === "Backspace" && !draft && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-[--color-border] bg-[--color-surface-2] p-2 min-h-11 focus-within:ring-2 focus-within:ring-[--color-brand] focus-within:ring-offset-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-[--color-brand-soft] text-[--color-brand-strong] px-2.5 py-0.5 text-xs font-semibold"
        >
          {tag}
          <button
            type="button"
            onClick={() => onRemove(tag)}
            aria-label={`Remove ${tag}`}
            className="hover:text-[--color-danger] transition-colors"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKey}
        placeholder={tags.length === 0 ? placeholder : "Add more…"}
        className="flex-1 min-w-32 bg-transparent text-sm outline-none placeholder:text-[--color-fg-faint] text-[--color-fg]"
      />
      {draft.trim() && (
        <button
          type="button"
          onClick={() => {
            if (draft.trim() && !tags.includes(draft.trim())) {
              onAdd(draft.trim());
              setDraft("");
            }
          }}
          className="flex size-6 items-center justify-center rounded-full bg-[--color-brand] text-white"
        >
          <Plus size={12} />
        </button>
      )}
    </div>
  );
}

// ── Subject chip ───────────────────────────────────────────────────────────

function SubjectToggleChip({
  subject,
  selected,
  onClick,
}: {
  subject: SubjectValue;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center rounded-full px-3.5 h-8 text-xs font-semibold transition-all duration-200 cursor-pointer select-none active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1",
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
    </button>
  );
}

// ── Save button ────────────────────────────────────────────────────────────

function SaveButton({
  onClick,
  loading,
  disabled,
}: {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("profile");
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "h-12 w-full rounded-full bg-brand text-white font-semibold shadow-sm",
        "transition-all hover:bg-brand-strong active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        "disabled:opacity-60 disabled:cursor-not-allowed",
      )}
    >
      {loading ? "…" : t("saveChanges")}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

type ProfileState = {
  full_name: string;
  grade: string;
  locale: LocaleValue;
  country: string;
  city: string;
  interests: CategorySlug[];
  subjects: SubjectValue[];
  target_majors: string[];
  goal: string;
};

function profileToState(p: ProfileRow): ProfileState {
  return {
    full_name: p.full_name ?? "",
    grade: p.grade != null ? String(p.grade) : "",
    locale: p.locale ?? "en",
    country: p.country ?? "",
    city: p.city ?? "",
    interests: (p.interests ?? []) as CategorySlug[],
    subjects: (p.subjects ?? []) as SubjectValue[],
    target_majors: p.target_majors ?? [],
    goal: p.goal ?? "",
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const tDash = useTranslations("dashboard");
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [form, setForm] = useState<ProfileState>({
    full_name: "",
    grade: "",
    locale: "en",
    country: "",
    city: "",
    interests: [],
    subjects: [],
    target_majors: [],
    goal: "",
  });
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getProfile().then(({ profile: p, error }) => {
      if (error || !p) {
        toast.error(error ?? "Failed to load profile");
        setLoading(false);
        return;
      }
      setProfile(p);
      setForm(profileToState(p));
      setLoading(false);
    });
    getCertificates().then(({ certificates: certs }) => {
      setCertificates(certs);
    });
  }, []);

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateProfile({
        full_name: form.full_name || undefined,
        grade: form.grade ? Number(form.grade) : undefined,
        locale: form.locale,
        country: form.country || undefined,
        city: form.city || undefined,
        interests: form.interests,
        subjects: form.subjects,
        target_majors: form.target_majors,
        goal: form.goal || undefined,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("saved"));
        router.refresh();
      }
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[--color-canvas] flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-[--color-brand] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--color-canvas] pb-16">
      {/* Header */}
      <div className="bg-[--color-surface] border-b border-[--color-border] px-4 py-5 mb-6">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-[--color-fg]">
              {form.full_name ? form.full_name : t("title")}
            </h1>
            <p className="text-sm text-[--color-fg-muted]">
              {t("academic")}
            </p>
          </div>
          <a
            href="/dashboard"
            className="text-sm font-semibold text-[--color-brand] hover:underline"
          >
            ← Dashboard
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 space-y-4">

        {/* XP + Streak stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatChip
            icon={Zap}
            label={tDash("totalXp")}
            value={profile?.xp ?? 0}
            color="#FFC800"
            chipBg="#FFF6D6"
          />
          <StatChip
            icon={Flame}
            label={tDash("dayStreak")}
            value={profile?.streak_count ?? 0}
            color="#FF9600"
            chipBg="#FFF1E0"
          />
        </div>

        {/* Personal info */}
        <SectionCard title={t("title")} icon={User}>
          <div className="space-y-4">
            <FieldRow label={t("fullName")}>
              <Input
                value={form.full_name}
                onChange={(e) =>
                  setForm((s) => ({ ...s, full_name: e.target.value }))
                }
                placeholder={t("fullName")}
                maxLength={120}
                className="rounded-full h-10 border-[--color-border] bg-[--color-surface-2] focus-visible:ring-[--color-brand]"
              />
            </FieldRow>

            <div className="grid grid-cols-2 gap-3">
              <FieldRow label={t("country")}>
                <Input
                  value={form.country}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, country: e.target.value }))
                  }
                  placeholder="Kazakhstan"
                  maxLength={80}
                  className="rounded-full h-10 border-[--color-border] bg-[--color-surface-2] focus-visible:ring-[--color-brand]"
                />
              </FieldRow>
              <FieldRow label={t("city")}>
                <Input
                  value={form.city}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, city: e.target.value }))
                  }
                  placeholder="Almaty"
                  maxLength={80}
                  className="rounded-full h-10 border-[--color-border] bg-[--color-surface-2] focus-visible:ring-[--color-brand]"
                />
              </FieldRow>
            </div>
          </div>
        </SectionCard>

        {/* Academic */}
        <SectionCard title={t("academic")} icon={GraduationCap}>
          <div className="space-y-4">
            <FieldRow label={t("grade")}>
              <div className="flex gap-2">
                {([8, 9, 10, 11] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm((s) => ({ ...s, grade: String(g) }))}
                    aria-pressed={form.grade === String(g)}
                    className={cn(
                      "h-9 w-14 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer active:scale-[0.97]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1",
                      form.grade === String(g)
                        ? "bg-brand text-white -translate-y-0.5"
                        : "bg-surface border border-border text-fg hover:border-fg/30 hover:shadow-sm",
                    )}
                    style={
                      form.grade === String(g)
                        ? { boxShadow: "0 8px 24px -6px rgba(22, 163, 74, 0.4)" }
                        : undefined
                    }
                  >
                    {g}
                  </button>
                ))}
              </div>
            </FieldRow>

            <FieldRow label={t("subjects")}>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_VALUES.map((s) => (
                  <SubjectToggleChip
                    key={s}
                    subject={s}
                    selected={form.subjects.includes(s)}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        subjects: toggle(prev.subjects, s),
                      }))
                    }
                  />
                ))}
              </div>
            </FieldRow>

            <FieldRow label={t("targetMajors")}>
              <TagInput
                tags={form.target_majors}
                onAdd={(tag) =>
                  setForm((s) => ({
                    ...s,
                    target_majors: [...s.target_majors, tag],
                  }))
                }
                onRemove={(tag) =>
                  setForm((s) => ({
                    ...s,
                    target_majors: s.target_majors.filter((item) => item !== tag),
                  }))
                }
                placeholder={t("targetMajorsPlaceholder")}
              />
            </FieldRow>
          </div>
        </SectionCard>

        {/* Interests */}
        <SectionCard title={t("interests")} icon={BookOpen}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.slug}
                slug={cat.slug}
                selected={form.interests.includes(cat.slug)}
                onClick={() =>
                  setForm((s) => ({
                    ...s,
                    interests: toggle(s.interests, cat.slug),
                  }))
                }
                card
              />
            ))}
          </div>
        </SectionCard>

        {/* Goal */}
        <SectionCard title={t("goal")} icon={Target}>
          <Textarea
            value={form.goal}
            onChange={(e) => setForm((s) => ({ ...s, goal: e.target.value }))}
            placeholder={t("goalPlaceholder")}
            maxLength={500}
            rows={3}
            className="resize-none rounded-2xl border-[--color-border] bg-[--color-surface-2] focus-visible:ring-[--color-brand] text-sm"
          />
          {/* TODO(prompt-9): re-embed profile on goal/interests change */}
        </SectionCard>

        {/* Save */}
        <SaveButton onClick={handleSave} loading={isPending} />

        {/* Account */}
        <SectionCard title={t("account")} icon={Globe}>
          <div className="space-y-4">
            <FieldRow label={t("language")}>
              <div className="flex gap-2">
                {LOCALE_VALUES.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setForm((s) => ({ ...s, locale: loc }));
                      startTransition(async () => {
                        await setLocale(loc);
                        router.refresh();
                      });
                    }}
                    aria-pressed={form.locale === loc}
                    className={cn(
                      "h-9 px-4 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-[0.97]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1",
                      form.locale === loc
                        ? "bg-brand text-white -translate-y-0.5"
                        : "bg-surface border border-border text-fg hover:border-fg/30 hover:shadow-sm",
                    )}
                    style={
                      form.locale === loc
                        ? { boxShadow: "0 8px 24px -6px rgba(22, 163, 74, 0.4)" }
                        : undefined
                    }
                  >
                    {loc === "ru" ? "Русский" : loc === "kk" ? "Қазақша" : "English"}
                  </button>
                ))}
              </div>
            </FieldRow>

            <div className="pt-1">
              <form action={signOut}>
                <button
                  type="submit"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border border-[--color-danger] px-4 h-9 text-sm font-semibold text-[--color-danger]",
                    "hover:bg-[--color-danger] hover:text-white transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-danger] focus-visible:ring-offset-1",
                  )}
                >
                  <LogOut size={14} />
                  {tNav("signOut")}
                </button>
              </form>
            </div>
          </div>
        </SectionCard>

        {/* Certificates */}
        <SectionCard title={t("myCertificates")} icon={Award}>
          {certificates.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div
                className="flex size-14 items-center justify-center rounded-2xl"
                style={{ background: "#FFF6D6" }}
              >
                <Award size={28} style={{ color: "#A16207" }} />
              </div>
              <p className="text-sm font-semibold text-[--color-fg-muted]">
                {t("noCertificates")}
              </p>
              <p className="text-xs text-[--color-fg-faint] max-w-xs">
                {t("noCertificatesDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {certificates.map((cert) => {
                const issued = new Date(cert.completion_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                return (
                  <div
                    key={cert.id}
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{ background: "#F0FDF4" }}
                  >
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "#DCFCE7" }}
                    >
                      <Award size={18} style={{ color: "#16A34A" }} strokeWidth={1.6} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[--color-fg] truncate">
                        {cert.course_title}
                      </p>
                      <p className="text-xs text-[--color-fg-muted]">Issued {issued}</p>
                    </div>
                    <Link
                      href={`/certificates/${cert.share_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border px-3 h-8 text-xs font-semibold transition-colors shrink-0"
                      style={{
                        borderColor: "#16A34A40",
                        color: "#16A34A",
                        background: "white",
                      }}
                    >
                      View
                      <ExternalLink size={10} strokeWidth={2} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
