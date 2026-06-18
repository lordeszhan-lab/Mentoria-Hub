"use client";

/**
 * LeaderboardClient — weekly XP ranking.
 *
 * Design language: matches onboarding / dashboard premium style.
 * – White rounded-2xl cards, shadow-card / shadow-card-hover
 * – One green accent (#16A34A); everything else neutral
 * – Thin lucide outline icons (strokeWidth 1.6) in soft tinted chips
 * – Hover lift on every interactive row
 * – Staggered fade-in entrance, respects prefers-reduced-motion
 * – No emoji, no flat list — every entry is a card
 */

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Trophy, Star, ArrowLeft, ArrowRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ease, dur } from "@/lib/motion/tokens";
import type { LeaderboardEntry, WeeklyLeaderboardResult } from "@/server/leaderboard/actions";

// ── Avatar colour palette (deterministic by initial) ──────────────────────────

const AVATAR_COLORS = [
  { bg: "rgba(22,163,74,0.12)",   fg: "#16A34A" },
  { bg: "rgba(28,176,246,0.12)",  fg: "#1CB0F6" },
  { bg: "rgba(255,150,0,0.12)",   fg: "#FF9600" },
  { bg: "rgba(206,130,255,0.12)", fg: "#CE82FF" },
  { bg: "rgba(20,184,166,0.12)",  fg: "#14B8A6" },
  { bg: "rgba(255,75,75,0.12)",   fg: "#FF4B4B" },
];

function avatarColor(initial: string) {
  const idx = initial.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ── Top-3 pod config ─────────────────────────────────────────────────────────

interface PodStyle {
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  badgeFg: string;
  xpColor: string;
}

const POD_STYLES: Record<1 | 2 | 3, PodStyle> = {
  1: {
    cardBg:     "rgba(245,158,11,0.08)",
    cardBorder: "rgba(245,158,11,0.30)",
    badgeBg:    "rgba(245,158,11,0.18)",
    badgeFg:    "#92400E",
    xpColor:    "#B45309",
  },
  2: {
    cardBg:     "#F1F5F9",
    cardBorder: "#CBD5E1",
    badgeBg:    "#E2E8F0",
    badgeFg:    "#475569",
    xpColor:    "#475569",
  },
  3: {
    cardBg:     "rgba(249,115,22,0.07)",
    cardBorder: "rgba(249,115,22,0.25)",
    badgeBg:    "rgba(249,115,22,0.15)",
    badgeFg:    "#9A3412",
    xpColor:    "#C2410C",
  },
};

// ── Stagger helper ────────────────────────────────────────────────────────────

function stagger(i: number, reduced: boolean) {
  return {
    initial: reduced ? false as const : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.04, duration: dur.base, ease: ease.out },
  };
}

// ── Top-3 podium card ─────────────────────────────────────────────────────────

function PodCard({
  entry,
  isCurrentUser,
  index,
  reduced,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  index: number;
  reduced: boolean;
}) {
  const rank = entry.rank as 1 | 2 | 3;
  const style = isCurrentUser
    ? {
        cardBg:     "rgba(22,163,74,0.08)",
        cardBorder: "rgba(22,163,74,0.25)",
        badgeBg:    "#16A34A",
        badgeFg:    "#FFFFFF",
        xpColor:    "#16A34A",
      }
    : POD_STYLES[rank];

  const av = avatarColor(entry.initial);

  return (
    <motion.div
      {...stagger(index, reduced)}
      whileHover={reduced ? undefined : { y: -4 }}
      transition={{ duration: 0.2, ease: ease.out }}
      className="flex flex-col items-center gap-3 rounded-2xl p-5 transition-all duration-200
        active:scale-[0.98] cursor-default"
      style={{
        background: style.cardBg,
        border: `1px solid ${style.cardBorder}`,
        boxShadow: "var(--shadow-card)",
      }}
      aria-label={`Rank ${entry.rank}: ${entry.firstName}, ${entry.weeklyXp} XP this week`}
    >
      {/* Rank badge */}
      <div
        className="flex items-center justify-center rounded-full text-sm font-extrabold"
        style={{
          width: 36, height: 36,
          background: style.badgeBg,
          color: style.badgeFg,
          fontVariantNumeric: "tabular-nums",
        }}
        aria-hidden
      >
        {entry.rank}
      </div>

      {/* Avatar */}
      <div
        className="flex items-center justify-center rounded-full font-extrabold text-base"
        style={{
          width: 48, height: 48,
          background: isCurrentUser ? "rgba(22,163,74,0.15)" : av.bg,
          color:      isCurrentUser ? "#16A34A"               : av.fg,
        }}
        aria-hidden
      >
        {entry.initial}
      </div>

      {/* Name */}
      <div className="text-center min-w-0 w-full">
        <p
          className={cn(
            "text-sm font-bold truncate leading-tight",
            isCurrentUser ? "text-[--color-brand]" : "text-[--color-fg]",
          )}
        >
          {entry.firstName}
          {isCurrentUser && (
            <span
              className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px]
                font-bold leading-none"
              style={{ background: "rgba(22,163,74,0.15)", color: "#16A34A" }}
            >
              Вы
            </span>
          )}
        </p>
      </div>

      {/* XP */}
      <div
        className="flex items-center gap-1 text-sm font-bold"
        style={{ color: style.xpColor, fontVariantNumeric: "tabular-nums" }}
      >
        <Star size={12} strokeWidth={0} fill="currentColor" aria-hidden />
        <span>{entry.weeklyXp.toLocaleString()}</span>
      </div>
    </motion.div>
  );
}

// ── Regular list row card ─────────────────────────────────────────────────────

function RowCard({
  entry,
  isCurrentUser,
  index,
  reduced,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  index: number;
  reduced: boolean;
}) {
  const av = avatarColor(entry.initial);

  return (
    <motion.div
      {...stagger(index, reduced)}
      whileHover={reduced ? undefined : { y: -2 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200",
        "active:scale-[0.99] cursor-default",
        isCurrentUser ? "border" : "border border-transparent hover:border-[--color-border]",
      )}
      style={
        isCurrentUser
          ? {
              background: "rgba(22,163,74,0.07)",
              borderColor: "rgba(22,163,74,0.22)",
              boxShadow: "var(--shadow-card)",
            }
          : {
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-card)",
            }
      }
      aria-label={`Rank ${entry.rank}: ${entry.firstName}, ${entry.weeklyXp} XP this week`}
    >
      {/* Rank badge */}
      <div
        className="shrink-0 flex items-center justify-center rounded-full text-xs font-extrabold"
        style={{
          width: 32, height: 32,
          background: isCurrentUser ? "#16A34A"                     : "var(--color-surface-2)",
          color:      isCurrentUser ? "#FFFFFF"                     : "var(--color-fg-muted)",
          fontVariantNumeric: "tabular-nums",
        }}
        aria-hidden
      >
        {entry.rank}
      </div>

      {/* Avatar initial */}
      <div
        className="shrink-0 flex items-center justify-center rounded-full font-extrabold text-sm"
        style={{
          width: 36, height: 36,
          background: isCurrentUser ? "rgba(22,163,74,0.15)" : av.bg,
          color:      isCurrentUser ? "#16A34A"               : av.fg,
        }}
        aria-hidden
      >
        {entry.initial}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-bold truncate leading-tight",
            isCurrentUser ? "text-[--color-brand]" : "text-[--color-fg]",
          )}
        >
          {entry.firstName}
        </p>
      </div>

      {/* "Вы" pill + XP */}
      <div className="shrink-0 flex items-center gap-2">
        {isCurrentUser && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold leading-none"
            style={{ background: "rgba(22,163,74,0.15)", color: "#16A34A" }}
          >
            Вы
          </span>
        )}
        <div className="text-right">
          <p
            className="text-sm font-semibold leading-tight"
            style={{
              color: isCurrentUser ? "#16A34A" : "var(--color-fg)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {entry.weeklyXp.toLocaleString()}
          </p>
          <p className="text-[10px] leading-tight" style={{ color: "var(--color-fg-faint)" }}>
            XP этой недели
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface LeaderboardClientProps {
  data: WeeklyLeaderboardResult;
  currentUserId: string;
}

export function LeaderboardClient({ data, currentUserId }: LeaderboardClientProps) {
  const reduced = useReducedMotion() ?? false;
  const { entries, currentUserEntry, weekLabel } = data;

  const top3 = entries.filter((e) => e.rank <= 3);
  const rest = entries.filter((e) => e.rank > 3);

  const currentUserInList = entries.some((e) => e.userId === currentUserId);
  const showPinnedRow = currentUserEntry && !currentUserInList;
  const isEmpty = entries.length === 0;

  return (
    <div className="min-h-screen bg-[--color-canvas] pb-16">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 space-y-5">

        {/* ── Back link ── */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[--color-fg-muted]
            hover:text-[--color-fg] transition-colors"
        >
          <ArrowLeft size={15} strokeWidth={1.6} aria-hidden />
          Дашборд
        </Link>

        {/* ── a) HEADER CARD ── */}
        <motion.div
          {...stagger(0, reduced)}
          whileHover={reduced ? undefined : { y: -3 }}
          className="rounded-2xl p-5 transition-all duration-200"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Trophy chip */}
              <div
                className="shrink-0 flex items-center justify-center rounded-xl"
                style={{
                  width: 44, height: 44,
                  background: "rgba(245,158,11,0.12)",
                }}
                aria-hidden
              >
                <Trophy
                  size={22}
                  strokeWidth={1.6}
                  style={{ color: "#D97706" }}
                />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-[--color-fg] leading-tight">
                  Лидерборд
                </h1>
                <p className="text-sm font-medium mt-0.5" style={{ color: "var(--color-fg-muted)" }}>
                  Рейтинг по XP за эту неделю · {weekLabel}
                </p>
              </div>
            </div>
            <p
              className="shrink-0 text-[11px] font-semibold text-right leading-tight hidden sm:block"
              style={{ color: "var(--color-fg-faint)" }}
            >
              Обновляется<br />каждую неделю
            </p>
          </div>

          {/* Context note */}
          <div
            className="flex items-start gap-2 mt-4 px-3 py-2.5 rounded-xl text-xs"
            style={{ background: "var(--color-surface-2)", color: "var(--color-fg-muted)" }}
          >
            <Info size={13} strokeWidth={1.6} className="shrink-0 mt-0.5" aria-hidden />
            <p>
              XP начисляется за уроки, квизы и шаги роадмапа. Главный показатель прогресса — твой трек, а лидерборд — дополнительная мотивация.
            </p>
          </div>
        </motion.div>

        {isEmpty ? (
          /* ── e) EMPTY STATE ── */
          <EmptyCard reduced={reduced} />
        ) : (
          <>
            {/* ── b) TOP-3 PODIUM ── */}
            {top3.length > 0 && (
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-3 px-1"
                  style={{ color: "var(--color-fg-faint)" }}
                >
                  Топ участники
                </p>
                <div
                  className={cn(
                    "grid gap-3",
                    top3.length === 1 ? "grid-cols-1 max-w-xs mx-auto" :
                    top3.length === 2 ? "grid-cols-2" :
                    "grid-cols-3",
                  )}
                >
                  {top3.map((entry, i) => (
                    <PodCard
                      key={entry.userId}
                      entry={entry}
                      isCurrentUser={entry.userId === currentUserId}
                      index={i + 1}
                      reduced={reduced}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── c) MAIN LIST (rank 4+) ── */}
            {rest.length > 0 && (
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-3 px-1"
                  style={{ color: "var(--color-fg-faint)" }}
                >
                  Остальные участники
                </p>
                <div className="space-y-2">
                  {rest.map((entry, i) => (
                    <RowCard
                      key={entry.userId}
                      entry={entry}
                      isCurrentUser={entry.userId === currentUserId}
                      index={top3.length + i + 1}
                      reduced={reduced}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── d) PINNED current-user (outside top-N) ── */}
            {showPinnedRow && (
              <motion.div
                {...stagger(entries.length + 2, reduced)}
                className="space-y-2"
              >
                {/* Ellipsis spacer */}
                <div className="flex items-center gap-2 px-1">
                  <div
                    className="flex-1 h-px"
                    style={{ background: "var(--color-border)" }}
                  />
                  <span
                    className="text-xs font-bold tracking-widest px-2"
                    style={{ color: "var(--color-fg-faint)" }}
                  >
                    · · ·
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ background: "var(--color-border)" }}
                  />
                </div>
                <RowCard
                  entry={currentUserEntry}
                  isCurrentUser
                  index={0}
                  reduced={reduced}
                />
              </motion.div>
            )}

            {/* ── CTA if user has no XP this week ── */}
            {!currentUserEntry && (
              <motion.div
                {...stagger(entries.length + 2, reduced)}
                className="rounded-2xl p-5 text-center"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <p className="text-sm font-semibold text-[--color-fg] mb-1">
                  Тебя ещё нет в рейтинге
                </p>
                <p
                  className="text-xs mb-4"
                  style={{ color: "var(--color-fg-muted)" }}
                >
                  Заверши урок или шаг роадмапа, чтобы набрать XP и появиться в таблице!
                </p>
                <Link
                  href="/roadmap"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
                    text-white transition-all duration-200 active:scale-[0.97]
                    hover:-translate-y-0.5"
                  style={{
                    background: "var(--color-brand)",
                    boxShadow: "0 4px 14px rgba(22,163,74,0.35)",
                  }}
                >
                  Перейти к роадмапу
                  <ArrowRight size={14} strokeWidth={2} aria-hidden />
                </Link>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Empty state card ──────────────────────────────────────────────────────────

function EmptyCard({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      {...stagger(1, reduced)}
      className="rounded-2xl p-10 text-center"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="mx-auto mb-4 flex items-center justify-center rounded-xl"
        style={{ width: 52, height: 52, background: "rgba(245,158,11,0.12)" }}
        aria-hidden
      >
        <Trophy size={26} strokeWidth={1.6} style={{ color: "#D97706" }} />
      </div>
      <h2 className="text-lg font-extrabold text-[--color-fg] mb-2">
        Рейтинг пока пуст
      </h2>
      <p
        className="text-sm mb-6 mx-auto max-w-xs"
        style={{ color: "var(--color-fg-muted)" }}
      >
        Выполняй шаги роадмапа и уроки курсов, чтобы набирать XP и появиться в рейтинге этой недели.
      </p>
      <Link
        href="/roadmap"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
          text-white transition-all duration-200 active:scale-[0.97] hover:-translate-y-0.5"
        style={{
          background: "var(--color-brand)",
          boxShadow: "0 4px 14px rgba(22,163,74,0.35)",
        }}
      >
        Перейти к роадмапу
        <ArrowRight size={14} strokeWidth={2} aria-hidden />
      </Link>
    </motion.div>
  );
}
