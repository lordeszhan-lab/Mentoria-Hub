"use client";

/**
 * AppShell — authenticated app layout with sidebar navigation.
 *
 * Desktop (≥ lg): fixed left sidebar (240px) + scrollable main content area.
 * Mobile (< lg):  sticky top bar with hamburger + slide-in drawer overlay.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Map,
  BookOpen,
  Compass,
  MessageCircle,
  User,
  LogOut,
  Star,
  Flame,
  Menu,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { signOut } from "@/server/auth/actions";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "@/components/notifications/notification-center";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AppShellProps {
  children: React.ReactNode;
  userName: string | null;
  xp: number;
  streakCount: number;
}

// ── Nav config with per-item accent colours ───────────────────────────────────

interface NavItem {
  href: string;
  labelKey: string;
  Icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    style?: React.CSSProperties;
    "aria-hidden"?: boolean | "true";
  }>;
  exact: boolean;
  iconColor: string;
  hoverBg: string;
}

interface NavSection {
  labelKey: string | null;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    labelKey: null,
    items: [
      {
        href: "/dashboard",
        labelKey: "dashboard",
        Icon: LayoutDashboard,
        exact: true,
        iconColor: "#1CB0F6",
        hoverBg: "rgba(28,176,246,0.08)",
      },
      {
        href: "/roadmap",
        labelKey: "myRoadmap",
        Icon: Map,
        exact: false,
        iconColor: "#16A34A",
        hoverBg: "rgba(22,163,74,0.08)",
      },
      {
        href: "/courses",
        labelKey: "courses",
        Icon: BookOpen,
        exact: false,
        iconColor: "#FF9600",
        hoverBg: "rgba(255,150,0,0.08)",
      },
      {
        href: "/opportunities",
        labelKey: "opportunities",
        Icon: Compass,
        exact: false,
        iconColor: "#CE82FF",
        hoverBg: "rgba(206,130,255,0.08)",
      },
      {
        href: "/mentor",
        labelKey: "aiMentor",
        Icon: MessageCircle,
        exact: false,
        iconColor: "#16A34A",
        hoverBg: "rgba(22,163,74,0.08)",
      },
    ],
  },
  {
    labelKey: "account",
    items: [
      {
        href: "/profile",
        labelKey: "profile",
        Icon: User,
        exact: true,
        iconColor: "#14B8A6",
        hoverBg: "rgba(20,184,166,0.08)",
      },
    ],
  },
];

// ── XP tier label ─────────────────────────────────────────────────────────────

function useXpTierLabel(xp: number): string {
  const t = useTranslations("dashboard");
  if (xp >= 1000) return "Expert";
  if (xp >= 500) return "Advanced";
  if (xp >= 100) return "Rising Star";
  return t("newcomer");
}

// ── Single nav link ───────────────────────────────────────────────────────────

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
}) {
  const t = useTranslations("nav");
  const isActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold select-none",
        "transition-all duration-150 active:scale-[0.97]",
        isActive
          ? "bg-brand text-white"
          : "text-[--color-fg-muted]",
      )}
      style={
        !isActive && hovered
          ? { background: item.hoverBg, color: "var(--color-fg)" }
          : undefined
      }
    >
      <item.Icon
        size={17}
        strokeWidth={2}
        style={{
          color: isActive ? "white" : item.iconColor,
          flexShrink: 0,
        }}
        aria-hidden
      />
      {t(item.labelKey as Parameters<typeof t>[0])}
    </Link>
  );
}

// ── Sidebar content (shared between desktop + drawer) ─────────────────────────

function SidebarContent({
  pathname,
  userName,
  xp,
  streakCount,
  onNavClick,
}: {
  pathname: string;
  userName: string | null;
  xp: number;
  streakCount: number;
  onNavClick?: () => void;
}) {
  const t = useTranslations("nav");
  const firstName = userName?.split(" ")[0] ?? null;
  const tier = useXpTierLabel(xp);
  const initial = (firstName ?? "M").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full">

      {/* ── Logo ── */}
      <div className="h-16 flex items-center px-4 shrink-0">
        <Link
          href="/dashboard"
          onClick={onNavClick}
          className="inline-flex items-center gap-2.5 rounded-xl px-1.5 py-1.5
            hover:bg-[--color-border]/40 transition-colors duration-150 active:scale-[0.97]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mentoria-logo.png"
            alt=""
            width={28}
            height={28}
            className="size-7 object-contain"
          />
          <span className="font-bold tracking-tight text-sm leading-none">
            <span className="text-[--color-fg]">Mentoria</span>{" "}
            <span style={{ color: "var(--color-accent-blue)" }}>Hub</span>
          </span>
        </Link>
      </div>

      {/* ── Nav sections ── */}
      <nav className="flex-1 px-3 py-2 space-y-5 overflow-y-auto" aria-label="App navigation">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.labelKey && (
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-[--color-fg-faint]">
                {t(section.labelKey as Parameters<typeof t>[0])}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onClick={onNavClick}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User block ── */}
      <div className="shrink-0 px-3 pb-4 pt-3 border-t border-[--color-border]">

        {/* XP + streak row */}
        <div className="flex items-center gap-3 mb-3 px-1">
          <div
            className="flex items-center gap-1 text-xs font-bold"
            style={{ color: "var(--color-accent-yellow)" }}
            aria-label={`${xp} XP`}
          >
            <Star size={12} strokeWidth={0} fill="currentColor" aria-hidden />
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {xp.toLocaleString()}
            </span>
            <span className="font-semibold" style={{ color: "var(--color-fg-faint)" }}>
              XP
            </span>
          </div>
          <span
            className="h-3 w-px rounded-full"
            style={{ background: "var(--color-border)" }}
            aria-hidden
          />
          <div
            className="flex items-center gap-1 text-xs font-bold"
            style={{
              color:
                streakCount > 0
                  ? "var(--color-accent-orange)"
                  : "var(--color-fg-faint)",
            }}
            aria-label={`${streakCount}-day streak`}
          >
            <Flame size={12} strokeWidth={0} fill="currentColor" aria-hidden />
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{streakCount}</span>
          </div>
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-2.5 px-1 mb-2">
          <div
            className="flex items-center justify-center rounded-full bg-brand/10 text-brand font-extrabold shrink-0"
            style={{ width: 32, height: 32, fontSize: 13 }}
            aria-hidden
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[--color-fg] truncate leading-tight">
              {firstName ?? "Student"}
            </p>
            <p className="text-[11px] leading-tight" style={{ color: "var(--color-fg-faint)" }}>
              {tier}
            </p>
          </div>
        </div>

        {/* Sign out */}
        <form action={signOut} className="w-full">
          <button
            type="submit"
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold",
              "text-[--color-fg-muted] transition-all duration-150 active:scale-[0.97]",
              "hover:bg-[rgba(255,75,75,0.08)] hover:text-[--color-accent-red]",
            )}
          >
            <LogOut size={15} strokeWidth={1.8} aria-hidden />
            {t("signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export function AppShell({ children, userName, xp, streakCount }: AppShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[--color-canvas]">

      {/* ── Desktop sidebar (fixed) ── */}
      <aside
        className="hidden lg:flex fixed inset-y-0 left-0 w-60 z-40 flex-col"
        style={{
          backgroundColor: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
        }}
        aria-label="Sidebar"
      >
        <SidebarContent
          pathname={pathname}
          userName={userName}
          xp={xp}
          streakCount={streakCount}
        />
      </aside>

      {/* ── Mobile top bar ── */}
      <header
        className="lg:hidden sticky top-0 z-50 h-14 flex items-center justify-between px-4 border-b border-[--color-border]"
        style={{ backgroundColor: "var(--color-canvas)" }}
      >
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center size-9 rounded-xl text-[--color-fg-muted]
            hover:bg-[--color-border]/60 transition-colors active:scale-[0.95]"
        >
          <Menu size={20} strokeWidth={1.8} aria-hidden />
        </button>

        {/* Mobile logo */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 font-bold tracking-tight active:scale-[0.97] transition-transform"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mentoria-logo.png"
            alt=""
            width={24}
            height={24}
            className="size-6 object-contain"
          />
          <span className="text-[--color-fg]">Mentoria</span>{" "}
          <span style={{ color: "var(--color-accent-blue)" }}>Hub</span>
        </Link>

        {/* Right: XP pill + bell */}
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-2 rounded-full border border-[--color-border]
              bg-[--color-surface-2] px-2.5 py-1 text-xs font-bold select-none"
            aria-label={`${xp} XP · ${streakCount}-day streak`}
          >
            <span className="flex items-center gap-1" style={{ color: "var(--color-accent-yellow)" }}>
              <Star size={11} strokeWidth={0} fill="currentColor" aria-hidden />
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{xp}</span>
            </span>
            <span className="h-3 w-px" style={{ background: "var(--color-border)" }} aria-hidden />
            <span
              className="flex items-center gap-1"
              style={{
                color:
                  streakCount > 0
                    ? "var(--color-accent-orange)"
                    : "var(--color-fg-faint)",
              }}
            >
              <Flame size={11} strokeWidth={0} fill="currentColor" aria-hidden />
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{streakCount}</span>
            </span>
          </div>
          <NotificationCenter iconSize={18} buttonClassName="size-9" />
        </div>
      </header>

      {/* ── Mobile drawer overlay ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 lg:hidden"
              style={{ background: "rgba(0,0,0,0.45)" }}
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col lg:hidden"
              style={{
                backgroundColor: "var(--color-surface)",
                borderRight: "1px solid var(--color-border)",
              }}
              aria-label="Mobile navigation"
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="absolute top-4 right-4 flex items-center justify-center size-8 rounded-xl
                  text-[--color-fg-muted] hover:bg-[--color-border]/60 transition-colors"
              >
                <X size={18} strokeWidth={2} aria-hidden />
              </button>
              <SidebarContent
                pathname={pathname}
                userName={userName}
                xp={xp}
                streakCount={streakCount}
                onNavClick={() => setDrawerOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main className="lg:pl-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
