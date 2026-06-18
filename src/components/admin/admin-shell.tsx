"use client";

/**
 * AdminShell — premium, restrained admin sidebar.
 *
 * Design language: one green accent, neutral chips, clean hover everywhere.
 * No rainbow icon tiles, no emoji, no joy layer.
 * Active item = solid green pill (white icon + text).
 * Inactive item = neutral icon chip + muted label, clear hover.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Compass,
  BookOpen,
  Users,
  Wand2,
  Menu,
  X,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { signOut } from "@/server/auth/actions";
import { cn } from "@/lib/utils";

// ── Nav config ────────────────────────────────────────────────────────────────

interface AdminNavItem {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
}

const NAV_ITEM_KEYS = [
  { href: "/admin/dashboard",     labelKey: "dashboard",     Icon: LayoutDashboard },
  { href: "/admin/opportunities", labelKey: "opportunities", Icon: Compass },
  { href: "/admin/courses",       labelKey: "courses",       Icon: BookOpen },
  { href: "/admin/users",         labelKey: "users",         Icon: Users },
  { href: "/admin/ingest",        labelKey: "aiIngest",      Icon: Wand2 },
] as const;

// ── Single nav link ────────────────────────────────────────────────────────────

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: { href: string; labelKey: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }> };
  pathname: string;
  onClick?: () => void;
}) {
  const t = useTranslations("admin");
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium select-none",
        "transition-colors duration-200 motion-reduce:transition-none",
        isActive
          ? "bg-primary text-primary-foreground font-semibold"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {/* Icon chip */}
      <span
        className={cn(
          "flex items-center justify-center size-7 rounded-lg shrink-0 transition-colors duration-200",
          isActive
            ? "bg-white/20 text-white"
            : "bg-muted text-muted-foreground group-hover:bg-border group-hover:text-foreground",
        )}
        aria-hidden
      >
        <item.Icon size={14} strokeWidth={1.6} aria-hidden />
      </span>

      <span className="flex-1 truncate">{t(item.labelKey as Parameters<typeof t>[0])}</span>
    </Link>
  );
}

// ── Sidebar content ────────────────────────────────────────────────────────────

function SidebarContent({
  pathname,
  onNavClick,
}: {
  pathname: string;
  onNavClick?: () => void;
}) {
  const t = useTranslations("admin");
  const tNav = useTranslations("nav");
  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="h-14 flex items-center px-4 shrink-0 border-b border-border">
        <Link
          href="/admin/dashboard"
          onClick={onNavClick}
          className="inline-flex items-center gap-2.5 rounded-xl px-1.5 py-1.5
            hover:bg-muted transition-colors duration-200 motion-reduce:transition-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mentoria-logo.png"
            alt=""
            width={24}
            height={24}
            className="size-6 object-contain shrink-0"
          />
          <span className="font-bold tracking-tight text-sm leading-none">
            <span className="text-foreground">Mentoria</span>{" "}
            <span className="text-muted-foreground font-medium">Admin</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"
        aria-label="Admin navigation"
      >
        <p className="mb-2.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {t("panel")}
        </p>
        {NAV_ITEM_KEYS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Bottom: admin badge + sign out */}
      <div className="shrink-0 px-3 pb-4 pt-3 border-t border-border space-y-1">
        {/* Admin badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted">
          <ShieldCheck
            size={13}
            strokeWidth={1.6}
            className="text-primary shrink-0"
            aria-hidden
          />
          <span className="text-xs font-medium text-muted-foreground">{t("panel")}</span>
        </div>

        {/* Sign out */}
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              text-muted-foreground hover:bg-destructive/8 hover:text-destructive
              transition-colors duration-200 motion-reduce:transition-none active:scale-[0.98]"
          >
            <span
              className="flex items-center justify-center size-7 rounded-lg bg-muted shrink-0
                group-hover:bg-destructive/10 transition-colors"
              aria-hidden
            >
              <LogOut size={13} strokeWidth={1.6} aria-hidden />
            </span>
            {tNav("signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Public component ───────────────────────────────────────────────────────────

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed inset-y-0 left-0 w-56 z-40 flex-col bg-card border-r border-border"
        aria-label="Admin sidebar"
      >
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-50 h-14 flex items-center justify-between px-4 bg-card border-b border-border">
        <button
          type="button"
          aria-label="Open admin menu"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center size-9 rounded-xl text-muted-foreground
            hover:bg-muted transition-colors duration-200 active:scale-[0.95]"
        >
          <Menu size={18} strokeWidth={1.6} aria-hidden />
        </button>

        <span className="text-sm font-semibold text-foreground">Mentoria Admin</span>

        <div className="size-9" aria-hidden />
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-50 lg:hidden bg-foreground/30 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col lg:hidden bg-card border-r border-border">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute top-3.5 right-3 flex items-center justify-center size-8 rounded-xl
                text-muted-foreground hover:bg-muted transition-colors duration-200"
            >
              <X size={16} strokeWidth={1.6} aria-hidden />
            </button>
            <SidebarContent
              pathname={pathname}
              onNavClick={() => setDrawerOpen(false)}
            />
          </div>
        </>
      )}

      {/* Main content */}
      <main className="lg:pl-56 min-h-screen">
        {children}
      </main>
    </div>
  );
}
