"use client";

/**
 * AppHeader — sticky top navigation for the authenticated app shell.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { signOut } from "@/server/auth/actions";
import { XpStreakPill } from "@/components/app/xp-streak-pill";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  userName?: string | null;
  xp?: number;
  streakCount?: number;
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/opportunities", label: "Opportunities", exact: false },
];

/**
 * Base classes shared by every pill-shaped nav item.
 * Uses plain hover:/active: — more reliable with Tailwind JIT scanning
 * than chained motion-safe:hover: variants.
 * motion-reduce:transition-none disables animation for users who prefer it.
 */
const pill =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold " +
  "transition-all duration-200 ease-out " +
  "active:scale-[0.97] " +
  "motion-reduce:transition-none motion-reduce:transform-none";

export function AppHeader({ userName, xp = 0, streakCount = 0 }: AppHeaderProps) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <header
      className="sticky top-0 z-50 h-14 border-b border-[--color-border] shadow-sm"
      style={{
        backgroundColor: "var(--color-canvas)",
        transform: "translateZ(0)",
      }}
    >
      <div className="mx-auto max-w-7xl h-full px-4 flex items-center justify-between gap-4">

        {/* ── Left: logo + primary nav ── */}
        <div className="flex items-center gap-5">

          {/*
           * Logo link — plain hover:opacity + hover:scale so the effect is
           * always visible (no motion-safe: prefix that could be missed by JIT).
           */}
          <Link
            href="/dashboard"
            aria-label="Mentoria Hub home"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-1.5 py-1",
              "hover:bg-[--color-border]/60 hover:scale-[1.03]",
              "active:scale-[0.97]",
              "transition-all duration-200 ease-out",
              "motion-reduce:transition-none motion-reduce:transform-none",
            )}
          >
            <img
              src="/mentoria-logo.png"
              alt=""
              width={28}
              height={28}
              className="size-7 object-contain"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <span className="hidden sm:inline font-bold tracking-tight leading-none">
              <span className="text-[--color-fg]">Mentoria</span>{" "}
              <span className="text-[--color-accent-blue]">Hub</span>
            </span>
          </Link>

          {/* Primary nav links */}
          <nav className="hidden sm:flex items-center gap-0.5" aria-label="App navigation">
            {NAV_LINKS.map(({ href, label, exact }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  pill,
                  isActive(href, exact)
                    ? "bg-brand/10 text-brand"
                    : "text-[--color-fg-muted] hover:text-[--color-fg] hover:bg-[--color-border]/70",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Right: XP/streak pill + profile link + sign-out ── */}
        <div className="flex items-center gap-2">

          {/* Animated XP + streak badge */}
          <XpStreakPill xp={xp} streakCount={streakCount} />

          {/* Profile / user chip */}
          <Link
            href="/profile"
            className={cn(
              pill,
              isActive("/profile", true)
                ? "bg-brand/10 text-brand"
                : "text-[--color-fg-muted] hover:text-[--color-fg] hover:bg-[--color-border]/70",
            )}
          >
            <User size={14} strokeWidth={2.2} aria-hidden />
            <span className="hidden sm:inline">{userName ?? "Profile"}</span>
          </Link>

          {/* Sign-out icon button */}
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className={cn(
                "inline-flex items-center justify-center size-8 rounded-full",
                "text-[--color-fg-muted] hover:text-[--color-fg] hover:bg-[--color-border]/70",
                "transition-all duration-200 ease-out",
                "active:scale-[0.90]",
                "motion-reduce:transition-none motion-reduce:transform-none",
              )}
            >
              <LogOut size={15} strokeWidth={2} aria-hidden />
            </button>
          </form>
        </div>

      </div>
    </header>
  );
}
