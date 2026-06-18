"use client";

/**
 * DashboardWidgets — premium, colourful student command centre.
 *
 * Layout (top → bottom):
 *   a) Greeting + bell row
 *   b) STAT ROW — 4 coloured tiles (XP · Lessons · Roadmap % · Streak)
 *   c) DUOLINGO STREAK widget (orange/blue circles, animated flame)
 *   d) "YOUR NEXT MOVE" — gradient banner hero
 *   e) TWO-COLUMN — left: Roadmap + Courses; right rail: Deadlines + Saved
 *   f) RECOMMENDED — horizontal coloured cards
 *
 * Colours: brand green stays primary (buttons, active states).
 *          Category palette (blue/orange/purple/yellow/teal/red) lives on
 *          banners, icons and stat tiles.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, animate } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  Download,
  ExternalLink,
  Flame,
  Heart,
  Map,
  MessageCircle,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { googleCalendarUrl, buildSingleEventIcs } from "@/lib/calendar/ics";
import { cn } from "@/lib/utils";
import { ease, dur } from "@/lib/motion/tokens";
import { NotificationCenter } from "@/components/notifications/notification-center";
import type {
  CourseRow,
  OpportunityRow,
  DeadlineRow,
  RoadmapStepStatus,
  OpportunityType,
} from "@/lib/supabase/types";
import type { RoadmapData } from "@/server/roadmap/actions";

// ── Prop types ─────────────────────────────────────────────────────────────────

interface CourseWithProgress extends CourseRow {
  progressPct: number;
  completedLessons: number;
  totalLessons: number;
  nextLessonId: string | null;
}

interface EnrichedDeadline extends DeadlineRow {
  daysLeft: number;
}

interface RecoItem {
  id: string;
  title: string;
  slug: string;
  type: OpportunityType;
  deadline: string | null;
  matchScore: number | null;
  reasons: string[];
}

export interface DashboardWidgetsProps {
  profile: {
    full_name: string | null;
    xp: number;
    streak_count: number;
    streak_last_active: string | null;
    calendar_token: string;
  };
  roadmap: RoadmapData | null;
  courses: CourseWithProgress[];
  savedOpps: OpportunityRow[];
  deadlines: EnrichedDeadline[];
  recommendations: RecoItem[];
  stats: {
    totalCompletedLessons: number;
    totalStepsDone: number;
    totalSteps: number;
  };
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function xpTier(xp: number, newcomerLabel: string) {
  if (xp >= 1000) return "Expert";
  if (xp >= 500) return "Advanced";
  if (xp >= 100) return "Rising Star";
  return newcomerLabel;
}

function urgencyColor(daysLeft: number) {
  if (daysLeft <= 3) return "var(--color-accent-red)";
  if (daysLeft <= 7) return "var(--color-accent-orange)";
  if (daysLeft <= 14) return "var(--color-accent-yellow)";
  return "var(--color-success)";
}

function urgencyBg(daysLeft: number) {
  if (daysLeft <= 3) return "rgba(255,75,75,0.08)";
  if (daysLeft <= 7) return "rgba(255,150,0,0.08)";
  if (daysLeft <= 14) return "rgba(255,200,0,0.08)";
  return "rgba(22,163,74,0.08)";
}

function daysLabel(daysLeft: number) {
  if (daysLeft === 0) return "Due today";
  if (daysLeft === 1) return "1 day left";
  return `${daysLeft}d left`;
}

const TYPE_LABELS: Record<OpportunityType, string> = {
  olympiad: "Olympiad",
  competition: "Competition",
  hackathon: "Hackathon",
  scholarship: "Scholarship",
  internship: "Internship",
  research: "Research",
  summer_school: "Summer School",
  volunteering: "Volunteering",
  other: "Other",
};

const STATUS_COLOR: Record<RoadmapStepStatus, string> = {
  locked: "var(--color-fg-faint)",
  available: "var(--color-brand)",
  in_progress: "var(--color-accent-blue)",
  done: "var(--color-success)",
};

// ── Motion helpers ─────────────────────────────────────────────────────────────

const fadeUp = (i: number) => ({
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.base, ease: ease.out, delay: i * 0.06 },
  },
});

// ── Shared card primitives ─────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("rounded-2xl bg-[--color-surface] overflow-hidden", className)}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {children}
    </div>
  );
}

function SectionEyebrow({ label, color }: { label: string; color?: string }) {
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-widest mb-2"
      style={{ color: color ?? "var(--color-fg-muted)" }}
    >
      {label}
    </p>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION A — PREMIUM KPI STAT TILES
// Each tile has its own full color identity: gradient bg, colored shadow,
// solid saturated icon chip (white icon), colored number, hover lift + glow,
// count-up on mount, and a faint decorative large icon in the corner.
// ═══════════════════════════════════════════════════════════════════════════════

interface KpiConfig {
  readonly id: string;
  readonly label: string;
  readonly suffix?: string;
  /** Solid color for the icon chip */
  readonly chipBg: string;
  /** Colored drop-shadow beneath the chip */
  readonly chipShadow: string;
  /** Full-card gradient background */
  readonly cardGradient: string;
  /** Resting card box-shadow (colored glow) */
  readonly restShadow: string;
  /** Intensified shadow on hover */
  readonly hoverShadow: string;
  /** Big number + label color */
  readonly numberColor: string;
  /** White icon rendered inside the chip */
  readonly chipIcon: React.ReactNode;
  /** Large translucent icon in card corner (decorative) */
  readonly decorIcon: React.ReactNode;
  /** Adds a subtle pulsing flame in the bottom-right */
  readonly isStreak?: boolean;
}

const KPI_CONFIGS: readonly KpiConfig[] = [
  {
    id: "xp",
    label: "Total XP",
    chipBg: "#F59E0B",
    chipShadow: "0 4px 14px rgba(245,158,11,0.55)",
    cardGradient: "linear-gradient(145deg, #fffef5 0%, #fef3c7 100%)",
    restShadow: "0 4px 22px -4px rgba(202,138,4,0.30)",
    hoverShadow: "0 14px 38px -4px rgba(202,138,4,0.48), 0 4px 12px -2px rgba(202,138,4,0.24)",
    numberColor: "#92400E",
    chipIcon: <Star size={21} strokeWidth={0} fill="white" aria-hidden />,
    decorIcon: <Star size={110} strokeWidth={0} fill="#F59E0B" aria-hidden />,
  },
  {
    id: "lessons",
    label: "Lessons done",
    chipBg: "#16A34A",
    chipShadow: "0 4px 14px rgba(22,163,74,0.50)",
    cardGradient: "linear-gradient(145deg, #f0fdf4 0%, #bbf7d0 100%)",
    restShadow: "0 4px 22px -4px rgba(22,163,74,0.28)",
    hoverShadow: "0 14px 38px -4px rgba(22,163,74,0.44), 0 4px 12px -2px rgba(22,163,74,0.22)",
    numberColor: "#14532D",
    chipIcon: <BookOpen size={19} strokeWidth={2.5} style={{ color: "white" }} aria-hidden />,
    decorIcon: <BookOpen size={110} strokeWidth={1.2} style={{ color: "#16A34A" }} aria-hidden />,
  },
  {
    id: "roadmap",
    label: "Roadmap",
    suffix: "%",
    chipBg: "#1CB0F6",
    chipShadow: "0 4px 14px rgba(28,176,246,0.50)",
    cardGradient: "linear-gradient(145deg, #f0f9ff 0%, #bae6fd 100%)",
    restShadow: "0 4px 22px -4px rgba(28,176,246,0.28)",
    hoverShadow: "0 14px 38px -4px rgba(28,176,246,0.44), 0 4px 12px -2px rgba(28,176,246,0.22)",
    numberColor: "#0C4A6E",
    chipIcon: <Trophy size={19} strokeWidth={2.5} style={{ color: "white" }} aria-hidden />,
    decorIcon: <Trophy size={110} strokeWidth={1.2} style={{ color: "#1CB0F6" }} aria-hidden />,
  },
  {
    id: "streak",
    label: "Day streak",
    chipBg: "#FF9600",
    chipShadow: "0 4px 14px rgba(255,150,0,0.55)",
    cardGradient: "linear-gradient(145deg, #fffbf0 0%, #fed7aa 100%)",
    restShadow: "0 4px 22px -4px rgba(234,88,12,0.28)",
    hoverShadow: "0 14px 38px -4px rgba(234,88,12,0.45), 0 4px 12px -2px rgba(234,88,12,0.22)",
    numberColor: "#7C2D12",
    chipIcon: <Flame size={21} strokeWidth={0} fill="white" aria-hidden />,
    decorIcon: <Flame size={110} strokeWidth={0} fill="#FF9600" aria-hidden />,
    isStreak: true,
  },
];

function PremiumStatTile({
  cfg,
  numericValue,
  index,
  labelOverride,
}: {
  cfg: KpiConfig;
  numericValue: number;
  index: number;
  labelOverride?: string;
}) {
  const prefersReduced = useReducedMotion();
  const [display, setDisplay] = useState(prefersReduced ? numericValue : 0);

  useEffect(() => {
    if (prefersReduced) { setDisplay(numericValue); return; }
    const controls = animate(0, numericValue, {
      duration: 1.1,
      ease: "easeOut",
      delay: index * 0.09,
      onUpdate(v) { setDisplay(Math.round(v)); },
    });
    return () => controls.stop();
    // value itself doesn't change between mounts; suppress exhaustive-deps warning
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericValue, prefersReduced]);

  return (
    <motion.div
      variants={fadeUp(index)}
      initial="hidden"
      animate="show"
      whileHover={prefersReduced ? undefined : {
        y: -5,
        boxShadow: cfg.hoverShadow,
        transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
      }}
      className="relative rounded-2xl p-5 overflow-hidden cursor-default"
      style={{
        background: cfg.cardGradient,
        boxShadow: cfg.restShadow,
      }}
    >
      {/* Faint decorative large icon — top-right corner */}
      <div
        className="absolute -right-5 -top-5 pointer-events-none select-none"
        style={{ opacity: 0.07 }}
        aria-hidden
      >
        {cfg.decorIcon}
      </div>

      {/* Solid saturated icon chip with white icon */}
      <div
        className="flex items-center justify-center rounded-xl mb-4"
        style={{
          width: 44,
          height: 44,
          background: cfg.chipBg,
          boxShadow: cfg.chipShadow,
        }}
      >
        {cfg.chipIcon}
      </div>

      {/* Count-up number */}
      <div
        className="text-[2rem] font-extrabold leading-none mb-1.5 relative z-10"
        style={{ fontVariantNumeric: "tabular-nums", color: cfg.numberColor }}
      >
        {display.toLocaleString()}
        {cfg.suffix && (
          <span className="text-xl font-extrabold ml-0.5">{cfg.suffix}</span>
        )}
      </div>

      {/* Label */}
      <p
        className="text-xs font-semibold relative z-10 leading-none"
        style={{ color: cfg.numberColor, opacity: 0.55 }}
      >
        {labelOverride ?? cfg.label}
      </p>

      {/* Streak: small pulsing flame accent in bottom-right */}
      {cfg.isStreak && numericValue > 0 && (
        <motion.div
          className="absolute bottom-4 right-5"
          animate={prefersReduced ? {} : {
            scale: [1, 1.12, 1],
            rotate: [0, -5, 5, 0],
          }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          <Flame size={18} strokeWidth={0} fill={cfg.chipBg} style={{ opacity: 0.45 }} />
        </motion.div>
      )}
    </motion.div>
  );
}

// ── SVG progress ring ─────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 42 }: { pct: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--color-brand)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transformOrigin: "center", transform: "rotate(-90deg)", transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)" }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
        fontSize={size * 0.22} fontWeight={700} fill="var(--color-fg)">
        {pct}%
      </text>
    </svg>
  );
}

// ── Calendar buttons ──────────────────────────────────────────────────────────

function CalendarSubscribeButton({ calendarToken }: { calendarToken: string }) {
  const [copied, setCopied] = useState(false);

  function handleSubscribe() {
    const origin = window.location.origin;
    const webcalUrl = `webcal://${origin.replace(/^https?:\/\//, "")}/api/calendar/${calendarToken}`;
    const httpsUrl = `${origin}/api/calendar/${calendarToken}`;

    navigator.clipboard.writeText(webcalUrl).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        toast.success("Calendar URL copied!", {
          description: `Your deadlines stay in your own calendar and update automatically. (Google can take up to ~24h to refresh; urgent items also come by email.)\n\nhttps URL: ${httpsUrl}`,
          duration: 7000,
        });
      },
      () => { window.location.href = webcalUrl; },
    );
  }

  return (
    <button
      type="button"
      onClick={handleSubscribe}
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold
        text-[--color-accent-blue] hover:opacity-75 transition-opacity active:scale-[0.97]"
    >
      {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
      {copied ? "Copied!" : "Subscribe"}
    </button>
  );
}

function AddToCalendarButton({ deadline }: { deadline: EnrichedDeadline }) {
  const [open, setOpen] = useState(false);

  const event = {
    id: deadline.id,
    title: deadline.title,
    dueAt: deadline.due_at,
    url: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
  };

  function handleGoogle() {
    window.open(googleCalendarUrl(event), "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  function handleIcs() {
    const ics = buildSingleEventIcs(event);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deadline.title.slice(0, 28).replace(/[^a-z0-9]/gi, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 h-6 px-2 rounded-lg border border-[--color-border]
          text-[10px] font-semibold text-[--color-fg-muted]
          hover:border-[--color-accent-blue] hover:text-[--color-accent-blue]
          transition-colors active:scale-[0.97]"
      >
        <Calendar size={10} strokeWidth={1.8} />
        Add
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="absolute right-0 top-full mt-1.5 z-20 min-w-[160px] rounded-xl overflow-hidden border border-[--color-border]"
            style={{ backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-pop)" }}
          >
            <button type="button" onClick={handleGoogle}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[--color-fg] hover:bg-[--color-surface-2] transition-colors text-left">
              <ExternalLink size={12} strokeWidth={2} /> Google Calendar
            </button>
            <button type="button" onClick={handleIcs}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[--color-fg] hover:bg-[--color-surface-2] transition-colors text-left">
              <Download size={12} strokeWidth={2} /> Download .ics
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION A — STAT ROW (4 coloured tiles)
// ═══════════════════════════════════════════════════════════════════════════════
// SECTION B — DUOLINGO STREAK WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

const ORANGE = "#FF9600";
const BLUE = "#1CB0F6";

const WEEKDAY_SHORT = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function isoDateStr(d: Date): string {
  // Use local date to avoid timezone flips
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function streakCopy(count: number, isActiveToday: boolean): string {
  if (!isActiveToday && count > 0) return "Come back today to keep your streak going!";
  if (count === 0) return "Start your streak — learn something today!";
  if (count === 1) return "Great start — come back tomorrow to build momentum.";
  if (count < 4) return `${count} days in a row — you're building momentum!`;
  if (count < 7) return `${count} days strong — you're on a real roll!`;
  if (count < 14) return `${count}-day streak! Consistency is your superpower.`;
  return `${count} days — exceptional dedication!`;
}

function Checkmark({ color = "white" }: { color?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DuolingoStreakWidget({
  streakCount,
  streakLastActive,
}: {
  streakCount: number;
  streakLastActive: string | null;
}) {
  const prefersReduced = useReducedMotion();

  // Current week Mon→Sun
  const today = new Date();
  const todayStr = isoDateStr(today);
  const dowIndex = (today.getDay() + 6) % 7; // Mon=0 … Sun=6

  const days = WEEKDAY_SHORT.map((label, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dowIndex + i);
    const dateStr = isoDateStr(d);
    const isToday = dateStr === todayStr;
    const isFuture = dateStr > todayStr;

    let isLit = false;
    if (streakLastActive && streakCount > 0) {
      const lastActive = new Date(streakLastActive + "T12:00:00");
      const thisDate = new Date(dateStr + "T12:00:00");
      const firstActive = new Date(lastActive);
      firstActive.setDate(lastActive.getDate() - streakCount + 1);
      isLit = thisDate >= firstActive && thisDate <= lastActive;
    }
    // Peak = most recent active day AND it's not today (today gets blue)
    const isPeak = streakLastActive === dateStr && !isToday;

    return { label, dateStr, isToday, isFuture, isLit, isPeak };
  });

  const isActiveToday = streakLastActive === todayStr;

  return (
    <motion.div
      variants={fadeUp(1)}
      initial="hidden"
      animate="show"
      className="rounded-2xl bg-[--color-surface] p-5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-200"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={prefersReduced ? {} : { scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }}
          >
            <Flame size={20} strokeWidth={0} fill={ORANGE} aria-hidden />
          </motion.div>
          <span className="text-sm font-extrabold text-[--color-fg]">
            {streakCount > 0 ? `${streakCount}-day streak` : "Start your streak"}
          </span>
        </div>
        {streakCount > 0 && (
          <span
            className="inline-flex items-center gap-1 h-6 px-3 rounded-full text-xs font-bold"
            style={{ background: "rgba(255,150,0,0.12)", color: ORANGE }}
          >
            <Flame size={11} strokeWidth={0} fill={ORANGE} aria-hidden />
            {streakCount} day{streakCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* 7-day circle row */}
      <div className="flex items-end justify-between gap-1">
        {days.map((day, i) => {
          const delay = prefersReduced ? 0 : i * 0.06;

          return (
            <div key={day.dateStr} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              {/* Day letter */}
              <span
                className="text-[10px] font-bold uppercase leading-none"
                style={{
                  color: day.isToday
                    ? BLUE
                    : day.isLit
                      ? ORANGE
                      : "var(--color-fg-faint)",
                }}
              >
                {day.label}
              </span>

              {/* Circle / Flame */}
              {day.isPeak ? (
                // Peak day — animated flame
                <motion.div
                  initial={prefersReduced ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 12, delay }}
                  className="flex items-center justify-center"
                  style={{ width: 36, height: 36 }}
                >
                  <motion.div
                    animate={prefersReduced ? {} : {
                      scale: [1, 1.18, 1, 1.18, 1],
                      rotate: [0, -6, 6, -6, 0],
                    }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }}
                  >
                    <Flame size={30} strokeWidth={0} fill={ORANGE} aria-hidden />
                  </motion.div>
                </motion.div>
              ) : day.isToday ? (
                // Today — blue circle (completed = solid, not yet = ring)
                <motion.div
                  initial={prefersReduced ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 480, damping: 13, delay }}
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 38,
                    height: 38,
                    background: day.isLit ? BLUE : "transparent",
                    border: `2.5px solid ${BLUE}`,
                    boxShadow: day.isLit
                      ? `0 0 0 4px rgba(28,176,246,0.20), 0 2px 8px rgba(28,176,246,0.30)`
                      : "none",
                  }}
                  aria-label={`Today — ${day.isLit ? "completed" : "not yet completed"}`}
                >
                  {day.isLit && <Checkmark color="white" />}
                </motion.div>
              ) : day.isLit ? (
                // Past lit day — solid orange circle with white check
                <motion.div
                  initial={prefersReduced ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 14, delay }}
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 34, height: 34, background: ORANGE }}
                  aria-label="Completed"
                >
                  <Checkmark color="white" />
                </motion.div>
              ) : (
                // Future or unlit day — faint ring
                <motion.div
                  initial={prefersReduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay }}
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 34,
                    height: 34,
                    border: "2px solid var(--color-border)",
                    opacity: day.isFuture ? 0.35 : 0.55,
                  }}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Encouraging copy */}
      <p className="mt-4 text-[11px] text-[--color-fg-muted] leading-relaxed">
        {streakCopy(streakCount, isActiveToday)}
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION C — "YOUR NEXT MOVE" gradient banner
// ═══════════════════════════════════════════════════════════════════════════════

function NextMoveBanner({ roadmap }: { roadmap: RoadmapData | null }) {
  const t = useTranslations("dashboard");
  if (!roadmap) {
    return (
      <motion.div variants={fadeUp(2)} initial="hidden" animate="show">
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1CB0F6 0%, #2B70C9 100%)",
            boxShadow: "0 4px 24px rgba(28,176,246,0.30)",
          }}
        >
          {/* Decorative circle */}
          <div
            className="absolute -right-8 -top-8 rounded-full opacity-10 pointer-events-none"
            style={{ width: 180, height: 180, background: "white" }}
            aria-hidden
          />
          <div
            className="flex items-center justify-center rounded-2xl shrink-0"
            style={{ width: 56, height: 56, background: "rgba(255,255,255,0.2)" }}
          >
            <Map size={26} strokeWidth={1.8} style={{ color: "white" }} aria-hidden />
          </div>
          <div className="flex-1 min-w-0 relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">
              {t("yourNextMove")}
            </p>
            <p className="font-extrabold text-white text-xl leading-snug">
              {t("myRoadmap")}
            </p>
            <p className="text-white/75 text-sm mt-1">
              Get a tailored action plan for your university goals.
            </p>
          </div>
          <Link
            href="/roadmap"
            className="relative z-10 inline-flex items-center gap-2 h-10 px-6 rounded-full
              bg-white text-[#1CB0F6] text-sm font-extrabold shrink-0
              hover:bg-white/90 active:scale-[0.97] transition-all duration-150"
          >
            Get started <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </motion.div>
    );
  }

  const nextStep = roadmap.steps.find(
    (s) => s.status === "available" || s.status === "in_progress",
  );

  if (!nextStep) {
    return (
      <motion.div variants={fadeUp(2)} initial="hidden" animate="show">
        <div
          className="rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #16A34A 0%, #0D9488 100%)",
            boxShadow: "0 4px 24px rgba(22,163,74,0.28)",
          }}
        >
          <div className="absolute -right-8 -top-8 rounded-full opacity-10 pointer-events-none"
            style={{ width: 180, height: 180, background: "white" }} aria-hidden />
          <div className="flex items-center justify-center rounded-2xl shrink-0"
            style={{ width: 52, height: 52, background: "rgba(255,255,255,0.2)" }}>
            <CheckCircle2 size={24} strokeWidth={2} style={{ color: "white" }} aria-hidden />
          </div>
          <div className="flex-1 relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">{t("yourNextMove")}</p>
            <p className="font-extrabold text-white text-xl">{t("myRoadmap")}</p>
            <p className="text-white/75 text-sm mt-0.5">{t("streakEncourage")}</p>
          </div>
          <Link href="/roadmap"
            className="relative z-10 inline-flex items-center gap-2 h-10 px-5 rounded-full bg-white
              text-brand text-sm font-extrabold shrink-0 hover:bg-white/90 active:scale-[0.97] transition-all">
            View roadmap
          </Link>
        </div>
      </motion.div>
    );
  }

  const daysLeft = nextStep.deadline
    ? Math.ceil((new Date(nextStep.deadline).getTime() - Date.now()) / 86_400_000)
    : null;
  const isUrgent = daysLeft !== null && daysLeft <= 7;
  const isInProgress = nextStep.status === "in_progress";

  const linkedHref = nextStep.opportunity?.slug
    ? `/opportunities/${nextStep.opportunity.slug}`
    : nextStep.course?.slug
      ? `/courses/${nextStep.course.slug}`
      : "/roadmap";

  return (
    <motion.div variants={fadeUp(2)} initial="hidden" animate="show">
      <div
        className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 relative overflow-hidden"
        style={{
          background: isUrgent
            ? "linear-gradient(135deg, #FF4B4B 0%, #FF9600 100%)"
            : "linear-gradient(135deg, #16A34A 0%, #0D9488 100%)",
          boxShadow: isUrgent
            ? "0 4px 24px rgba(255,75,75,0.28)"
            : "0 4px 24px rgba(22,163,74,0.28)",
        }}
      >
        {/* Decorative circle */}
        <div className="absolute -right-10 -top-10 rounded-full opacity-10 pointer-events-none"
          style={{ width: 200, height: 200, background: "white" }} aria-hidden />
        <div className="absolute -right-4 bottom-0 rounded-full opacity-5 pointer-events-none"
          style={{ width: 120, height: 120, background: "white" }} aria-hidden />

        {/* Icon */}
        <div className="flex items-center justify-center rounded-2xl shrink-0 relative z-10"
          style={{ width: 56, height: 56, background: "rgba(255,255,255,0.2)" }}>
          {isInProgress
            ? <Zap size={26} strokeWidth={0} fill="white" aria-hidden />
            : <Map size={26} strokeWidth={1.8} style={{ color: "white" }} aria-hidden />
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">
            Your next move
          </p>
          <p className="font-extrabold text-white text-xl leading-snug line-clamp-2">
            {nextStep.title}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="text-white/75 text-xs font-semibold">
              Grade {nextStep.grade}{nextStep.term ? ` · ${nextStep.term}` : ""}
            </span>
            {daysLeft !== null && (
              <span className="inline-flex items-center gap-1 text-white/90 text-xs font-bold">
                <Clock size={11} strokeWidth={2.2} />
                {daysLabel(daysLeft)}
              </span>
            )}
            {isUrgent && (
              <span className="inline-flex items-center h-4 px-2 rounded-full text-[10px] font-bold
                bg-white/20 text-white">
                Urgent
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <Link
          href={linkedHref}
          className="relative z-10 inline-flex items-center gap-2 h-11 px-6 rounded-full
            bg-white text-sm font-extrabold shrink-0
            hover:bg-white/90 active:scale-[0.97] transition-all duration-150"
          style={{ color: isUrgent ? "#FF4B4B" : "#16A34A" }}
        >
          Go <ArrowRight size={14} strokeWidth={2.5} />
        </Link>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION D-LEFT — Roadmap compact
// ═══════════════════════════════════════════════════════════════════════════════

function RoadmapCompactWidget({ roadmap }: { roadmap: RoadmapData | null }) {
  const upcoming = roadmap
    ? roadmap.steps.filter((s) => s.status !== "done").slice(0, 5)
    : [];

  return (
    <motion.div variants={fadeUp(3)} initial="hidden" animate="show">
      <Card className="flex flex-col">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b border-[--color-border]"
          style={{ background: "rgba(22,163,74,0.04)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg"
              style={{ width: 24, height: 24, background: "rgba(22,163,74,0.12)" }}>
              <Map size={13} strokeWidth={2} style={{ color: "var(--color-brand)" }} aria-hidden />
            </div>
            <span className="text-xs font-bold text-[--color-fg]">My Roadmap</span>
          </div>
          <Link href="/roadmap"
            className="text-xs font-semibold text-brand hover:opacity-70 transition-opacity
              flex items-center gap-1 active:scale-[0.97]">
            Full view <ArrowRight size={11} strokeWidth={2.2} />
          </Link>
        </div>

        {/* Body */}
        <div className="flex-1">
          {!roadmap ? (
            <div className="px-5 py-8 flex flex-col items-center gap-3">
              <Map size={32} strokeWidth={1.4} style={{ color: "var(--color-fg-faint)" }} aria-hidden />
              <p className="text-sm text-[--color-fg-muted] text-center">No roadmap yet.</p>
              <Link href="/roadmap"
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full bg-brand text-white
                  text-xs font-bold hover:bg-[--color-brand-strong] transition-colors active:scale-[0.97]">
                Generate roadmap
              </Link>
            </div>
          ) : upcoming.length === 0 ? (
            <div className="px-5 py-8 flex flex-col items-center gap-2">
              <CheckCircle2 size={28} strokeWidth={1.5} style={{ color: "var(--color-brand)" }} className="mx-auto" aria-hidden />
              <p className="text-sm font-semibold text-[--color-fg]">All steps complete!</p>
            </div>
          ) : (
            <div className="divide-y divide-[--color-border]">
              {upcoming.map((step, i) => {
                const daysLeft = step.deadline
                  ? Math.ceil((new Date(step.deadline).getTime() - Date.now()) / 86_400_000)
                  : null;
                const isActionable = step.status !== "locked";
                return (
                  <Link
                    key={step.id}
                    href="/roadmap"
                    className={cn(
                      "flex items-start gap-3 px-5 py-3 transition-colors duration-150",
                      isActionable
                        ? "hover:bg-[--color-surface-2] active:scale-[0.99] cursor-pointer"
                        : "cursor-default",
                    )}
                  >
                    {/* Status indicator */}
                    <div
                      className="shrink-0 mt-[5px] size-2.5 rounded-full"
                      style={{ background: STATUS_COLOR[step.status] }}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold text-[--color-fg] line-clamp-1 leading-snug"
                        style={{ opacity: step.status === "locked" ? 0.45 : 1 }}
                      >
                        {step.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[--color-fg-faint]">
                          Gr.{step.grade}{step.term ? ` ${step.term}` : ""}
                        </span>
                        {daysLeft !== null && isActionable && (
                          <span className="text-[10px] font-semibold"
                            style={{ color: urgencyColor(daysLeft) }}>
                            {daysLabel(daysLeft)}
                          </span>
                        )}
                      </div>
                    </div>
                    {i === 0 && isActionable && (
                      <ArrowRight size={13} strokeWidth={2.2}
                        className="shrink-0 mt-0.5 text-brand" aria-hidden />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION D-LEFT — Active courses
// ═══════════════════════════════════════════════════════════════════════════════

function ActiveCoursesWidget({ courses }: { courses: CourseWithProgress[] }) {
  const display = courses.slice(0, 3);
  return (
    <motion.div variants={fadeUp(4)} initial="hidden" animate="show">
      <Card className="flex flex-col">
        <div
          className="flex items-center justify-between px-5 py-3 border-b border-[--color-border]"
          style={{ background: "rgba(255,150,0,0.04)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg"
              style={{ width: 24, height: 24, background: "rgba(255,150,0,0.12)" }}>
              <BookOpen size={13} strokeWidth={2} style={{ color: "var(--color-accent-orange)" }} aria-hidden />
            </div>
            <span className="text-xs font-bold text-[--color-fg]">Active Courses</span>
          </div>
          <Link href="/courses"
            className="text-xs font-semibold text-[--color-accent-orange] hover:opacity-70
              transition-opacity flex items-center gap-1 active:scale-[0.97]">
            All <ArrowRight size={11} strokeWidth={2.2} />
          </Link>
        </div>
        <div className="flex-1">
          {display.length === 0 ? (
            <div className="px-5 py-8 flex flex-col items-center gap-3">
              <BookOpen size={32} strokeWidth={1.4} style={{ color: "var(--color-fg-faint)" }} aria-hidden />
              <p className="text-sm text-[--color-fg-muted] text-center">No enrolled courses yet.</p>
              <Link href="/courses"
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full border
                  border-[--color-border] text-xs font-semibold text-[--color-fg-muted]
                  hover:border-[--color-accent-orange] hover:text-[--color-accent-orange]
                  transition-colors active:scale-[0.97]">
                Browse courses
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[--color-border]">
              {display.map((course) => {
                const href = course.nextLessonId
                  ? `/courses/${course.slug}/lessons/${course.nextLessonId}`
                  : `/courses/${course.slug}`;
                return (
                  <div key={course.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-[--color-surface-2] transition-colors">
                    <ProgressRing pct={course.progressPct} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[--color-fg] line-clamp-1">{course.title}</p>
                      <p className="text-[11px] text-[--color-fg-muted] mt-0.5">
                        {course.completedLessons}/{course.totalLessons} lessons
                      </p>
                    </div>
                    <Link href={href}
                      className="shrink-0 inline-flex items-center gap-1 h-7 px-3 rounded-full
                        bg-brand/10 text-brand text-[11px] font-bold
                        hover:bg-brand/20 transition-colors active:scale-[0.97]">
                      Continue
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION D-RIGHT — Upcoming deadlines
// ═══════════════════════════════════════════════════════════════════════════════

function DeadlinesWidget({
  deadlines,
  calendarToken,
}: {
  deadlines: EnrichedDeadline[];
  calendarToken: string;
}) {
  const t = useTranslations("dashboard");
  return (
    <motion.div variants={fadeUp(3)} initial="hidden" animate="show">
      <Card className="flex flex-col">
        <div
          className="flex items-center justify-between px-5 py-3 border-b border-[--color-border]"
          style={{ background: "rgba(255,75,75,0.03)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg"
              style={{ width: 24, height: 24, background: "rgba(255,75,75,0.10)" }}>
              <Calendar size={13} strokeWidth={2} style={{ color: "var(--color-accent-red)" }} aria-hidden />
            </div>
            <span className="text-xs font-bold text-[--color-fg]">{t("upcomingDeadlines")}</span>
          </div>
          <CalendarSubscribeButton calendarToken={calendarToken} />
        </div>
        <div className="flex-1">
          {deadlines.length === 0 ? (
            <div className="px-5 py-8 flex flex-col items-center gap-2">
              <Calendar size={28} strokeWidth={1.4} style={{ color: "var(--color-fg-faint)" }} aria-hidden />
              <p className="text-xs text-[--color-fg-muted] text-center leading-relaxed">
                {t("noDeadlines")}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-[--color-border]">
                {deadlines.slice(0, 4).map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[--color-surface-2] transition-colors">
                    <div
                      className="shrink-0 flex items-center justify-center rounded-lg"
                      style={{ width: 32, height: 32, background: urgencyBg(d.daysLeft) }}
                    >
                      <Calendar size={14} strokeWidth={1.8}
                        style={{ color: urgencyColor(d.daysLeft) }} aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[--color-fg] line-clamp-1">{d.title}</p>
                      <span className="text-[11px] font-bold"
                        style={{ color: urgencyColor(d.daysLeft) }}>
                        {daysLabel(d.daysLeft)}
                      </span>
                    </div>
                    <AddToCalendarButton deadline={d} />
                  </div>
                ))}
              </div>
              <p className="px-5 py-3 text-[10px] text-[--color-fg-faint] leading-relaxed border-t border-[--color-border]">
                Your deadlines stay in your calendar and update automatically.
                (Google refreshes ~24h.)
              </p>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION D-RIGHT — Saved opportunities
// ═══════════════════════════════════════════════════════════════════════════════

function SavedOppsWidget({ savedOpps }: { savedOpps: OpportunityRow[] }) {
  const display = savedOpps.slice(0, 4);
  return (
    <motion.div variants={fadeUp(4)} initial="hidden" animate="show">
      <Card className="flex flex-col">
        <div
          className="flex items-center justify-between px-5 py-3 border-b border-[--color-border]"
          style={{ background: "rgba(206,130,255,0.04)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg"
              style={{ width: 24, height: 24, background: "rgba(206,130,255,0.12)" }}>
              <Heart size={13} strokeWidth={0} fill="var(--color-accent-purple)" aria-hidden />
            </div>
            <span className="text-xs font-bold text-[--color-fg]">Saved</span>
          </div>
          <Link href="/opportunities"
            className="text-xs font-semibold text-[--color-accent-purple] hover:opacity-70
              transition-opacity flex items-center gap-1 active:scale-[0.97]">
            Browse <ArrowRight size={11} strokeWidth={2.2} />
          </Link>
        </div>
        <div className="flex-1">
          {display.length === 0 ? (
            <div className="px-5 py-8 flex flex-col items-center gap-2">
              <Heart size={28} strokeWidth={1.4} style={{ color: "var(--color-fg-faint)" }} aria-hidden />
              <p className="text-xs text-[--color-fg-muted] text-center">No saved opportunities yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[--color-border]">
              {display.map((opp) => {
                const dl = opp.deadline
                  ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86_400_000)
                  : null;
                return (
                  <Link key={opp.id} href={`/opportunities/${opp.slug}`}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-[--color-surface-2] transition-colors">
                    <div
                      className="shrink-0 mt-0.5 flex items-center justify-center rounded-lg"
                      style={{ width: 28, height: 28, background: "rgba(206,130,255,0.10)" }}
                    >
                      <Heart size={12} strokeWidth={0} fill="var(--color-accent-purple)" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[--color-fg] line-clamp-1">{opp.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[--color-fg-faint]">{TYPE_LABELS[opp.type]}</span>
                        {dl !== null && (
                          <span className="text-[10px] font-semibold"
                            style={{ color: urgencyColor(dl) }}>
                            {daysLabel(dl)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION D-RIGHT-BOTTOM — Leaderboard teaser (secondary, supportive)
// Small card linking to /leaderboard — kept visually lighter than the hero
// track-progress widgets above.
// ═══════════════════════════════════════════════════════════════════════════════

function currentWeekLabel(): string {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const daysSinceMon = (utcDay + 6) % 7;
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMon),
  );
  const sunday = new Date(monday.getTime() + 6 * 86_400_000);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function LeaderboardTeaserWidget() {
  const weekLabel = currentWeekLabel();
  return (
    <motion.div variants={fadeUp(5)} initial="hidden" animate="show">
      <Card>
        <Link
          href="/leaderboard"
          className="flex items-center gap-3 px-5 py-4 group
            hover:bg-[--color-surface-2] transition-colors duration-150 active:scale-[0.99]"
        >
          <div
            className="shrink-0 flex items-center justify-center rounded-xl"
            style={{ width: 36, height: 36, background: "rgba(245,158,11,0.12)" }}
            aria-hidden
          >
            <Trophy size={18} strokeWidth={1.8} style={{ color: "#F59E0B" }} aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[--color-fg]">Weekly Leaderboard</p>
            <p className="text-[10px] text-[--color-fg-faint] truncate">{weekLabel}</p>
          </div>
          <ArrowRight
            size={14} strokeWidth={2}
            className="shrink-0 text-[--color-fg-faint] group-hover:text-[--color-fg]
              group-hover:translate-x-0.5 transition-all duration-150"
            aria-hidden
          />
        </Link>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION E — Recommended for you (premium minimal cards)
// ═══════════════════════════════════════════════════════════════════════════════

function RecommendedEyebrow() {
  const t = useTranslations("dashboard");
  return <SectionEyebrow label={t("recommendedForYou")} />;
}

function RecommendedWidget({ recommendations }: { recommendations: RecoItem[] }) {
  const t = useTranslations("catalog");
  return (
    <motion.div variants={fadeUp(5)} initial="hidden" animate="show">
      <div>
        <RecommendedEyebrow />
        {recommendations.length === 0 ? (
          <Card>
            <div className="px-5 py-8 flex flex-col items-center gap-3">
              <Compass size={32} strokeWidth={1.4} style={{ color: "var(--color-fg-faint)" }} aria-hidden />
              <p className="text-sm text-[--color-fg-muted] text-center">
                {t("completeProfile")}
              </p>
              <Link href="/profile"
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full border
                  border-[--color-border] text-xs font-semibold text-[--color-fg-muted]
                  hover:border-[--color-brand] hover:text-brand
                  transition-colors active:scale-[0.97]">
                Update profile
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recommendations.map((reco) => {
              const dl = reco.deadline
                ? Math.ceil((new Date(reco.deadline).getTime() - Date.now()) / 86_400_000)
                : null;
              const score = reco.matchScore;
              const scoreColor =
                score !== null
                  ? score >= 75
                    ? "var(--color-brand)"
                    : score >= 50
                      ? "var(--color-accent-orange)"
                      : "var(--color-fg-muted)"
                  : "var(--color-fg-muted)";

              return (
                <Link
                  key={reco.id}
                  href={`/opportunities/${reco.slug}`}
                  className="group flex flex-col gap-3 rounded-2xl p-5 bg-[--color-surface]
                    border border-[--color-border]
                    hover:-translate-y-0.5 hover:border-[--color-brand]/30
                    hover:shadow-[var(--shadow-card-hover)]
                    active:scale-[0.99] transition-all duration-200"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  {/* Top row: type chip + match score */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center h-5 px-2.5 rounded-full text-[10px] font-semibold
                        bg-[--color-surface-2] text-[--color-fg-muted] border border-[--color-border]"
                    >
                      {TYPE_LABELS[reco.type]}
                    </span>
                    {score !== null && (
                      <span
                        className="text-[11px] font-bold tabular-nums shrink-0"
                        style={{ color: scoreColor }}
                        aria-label={`${score}% match`}
                      >
                        {score}% match
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <p className="text-sm font-semibold leading-snug text-[--color-fg] line-clamp-2
                    group-hover:text-brand transition-colors duration-150">
                    {reco.title}
                  </p>

                  {/* Footer: deadline + arrow */}
                  <div className="flex items-center justify-between mt-auto pt-1">
                    {dl !== null ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium"
                        style={{ color: urgencyColor(dl) }}>
                        <Clock size={10} strokeWidth={2} />
                        {daysLabel(dl)}
                      </span>
                    ) : (
                      <span />
                    )}
                    <ArrowRight
                      size={13} strokeWidth={2}
                      className="text-[--color-fg-faint] group-hover:text-brand group-hover:translate-x-0.5
                        transition-all duration-150"
                      aria-hidden
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT — assembles the full dashboard layout
// ═══════════════════════════════════════════════════════════════════════════════

function MyRoadmapEyebrow() {
  const t = useTranslations("dashboard");
  return <SectionEyebrow label={t("myRoadmap")} color="var(--color-brand)" />;
}
function ActiveCoursesEyebrow() {
  const t = useTranslations("dashboard");
  return <SectionEyebrow label={t("activeCourses")} color="var(--color-accent-orange)" />;
}
function UpcomingDeadlinesEyebrow() {
  const t = useTranslations("dashboard");
  return <SectionEyebrow label={t("upcomingDeadlines")} color="var(--color-accent-red)" />;
}

export function DashboardWidgets({
  profile,
  roadmap,
  courses,
  savedOpps,
  deadlines,
  recommendations,
  stats,
}: DashboardWidgetsProps) {
  const t = useTranslations("dashboard");
  const firstName = profile.full_name?.split(" ")[0] ?? null;
  const stepsProgress =
    stats.totalSteps > 0
      ? Math.round((stats.totalStepsDone / stats.totalSteps) * 100)
      : 0;

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-5">

      {/* ── a) Greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-[--color-fg] leading-tight">
            {firstName
              ? t("greeting", { name: firstName })
              : t("greeting", { name: "…" })}
          </h1>
          <p className="text-sm text-[--color-fg-muted] mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <NotificationCenter
          iconSize={17}
          buttonClassName="size-10 rounded-xl border border-[--color-border]
            bg-[--color-surface] text-[--color-fg-muted]
            hover:border-[--color-accent-blue] hover:text-[--color-accent-blue]
            hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]
            transition-all duration-200 active:scale-[0.95] sm:hidden lg:flex"
        />
      </motion.div>

      {/* ── b) STAT ROW — 4 premium KPI tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <PremiumStatTile cfg={KPI_CONFIGS[0]} numericValue={profile.xp} index={0} labelOverride={t("totalXp")} />
        <PremiumStatTile cfg={KPI_CONFIGS[1]} numericValue={stats.totalCompletedLessons} index={1} labelOverride={t("lessonsDone")} />
        <PremiumStatTile cfg={KPI_CONFIGS[2]} numericValue={stepsProgress} index={2} labelOverride={t("roadmapProgress")} />
        <PremiumStatTile cfg={KPI_CONFIGS[3]} numericValue={profile.streak_count} index={3} labelOverride={t("dayStreak")} />
      </div>

      {/* ── c) DUOLINGO STREAK ── */}
      <DuolingoStreakWidget
        streakCount={profile.streak_count}
        streakLastActive={profile.streak_last_active}
      />

      {/* ── d) NEXT MOVE BANNER ── */}
      <NextMoveBanner roadmap={roadmap} />

      {/* ── e0) AI MENTOR ENTRY POINT ── */}
      <Link
        href="/mentor"
        className="flex items-center gap-4 rounded-2xl px-5 py-4 border border-[--color-border]
          transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99]"
        style={{
          backgroundColor: "var(--color-surface)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
        aria-label="Open AI Mentor chat"
      >
        <div
          className="flex-shrink-0 size-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--color-brand-soft)" }}
        >
          <MessageCircle
            size={20}
            strokeWidth={1.6}
            style={{ color: "var(--color-brand)" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[--color-fg] leading-tight">
            Ask your AI Mentor
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-fg-muted)" }}>
            Knows your roadmap &amp; goals — get specific, grounded advice
          </p>
        </div>
        <ArrowRight
          size={16}
          strokeWidth={2}
          style={{ color: "var(--color-brand)", flexShrink: 0 }}
        />
      </Link>

      {/* ── e) TWO-COLUMN: LEFT (roadmap + courses) + RIGHT RAIL ── */}
      {/*
        items-start prevents CSS grid from stretch-assigning heights to columns.
        Without it, column divs get an explicit height equal to the taller sibling,
        which caused h-full children to each fill the full column → overlap.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: takes 2 of 3 cols on desktop */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <MyRoadmapEyebrow />
            <RoadmapCompactWidget roadmap={roadmap} />
          </div>
          <div>
            <ActiveCoursesEyebrow />
            <ActiveCoursesWidget courses={courses} />
          </div>
        </div>

        {/* Right rail: 1 of 3 cols */}
        <div className="flex flex-col gap-6">
          <div>
            <UpcomingDeadlinesEyebrow />
            <DeadlinesWidget deadlines={deadlines} calendarToken={profile.calendar_token} />
          </div>
          <div>
            <SectionEyebrow label="Saved" color="var(--color-accent-purple)" />
            <SavedOppsWidget savedOpps={savedOpps} />
          </div>
          <LeaderboardTeaserWidget />
        </div>
      </div>

      {/* ── f) RECOMMENDED ROW ── */}
      <RecommendedWidget recommendations={recommendations} />
    </div>
  );
}
