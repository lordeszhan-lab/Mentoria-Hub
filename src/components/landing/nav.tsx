"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how" },
  { label: "For students", href: "#students" },
  { label: "For mentors", href: "#mentors" },
  { label: "Pricing", href: "#pricing" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-surface/95 backdrop-blur-sm border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Wordmark */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-full"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-black text-white">
              M
            </span>
            <span className="text-[1.05rem] font-black tracking-tight text-fg">
              Mentoria <span className="text-brand">Hub</span>
            </span>
          </Link>

          {/* Desktop center anchors */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 text-sm font-semibold text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop right CTAs */}
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/auth/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-fg-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Log in
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex h-9 items-center rounded-full bg-brand px-5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-brand-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Get started free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile full-screen sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-full">
          <SheetHeader className="pb-6">
            <SheetTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-black text-white">
                M
              </span>
              <span className="text-[1.05rem] font-black tracking-tight text-fg">
                Mentoria <span className="text-brand">Hub</span>
              </span>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1 px-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-semibold text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <SheetFooter className="gap-3 px-4 pb-8 pt-6">
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="flex h-12 w-full items-center justify-center rounded-full border border-border text-sm font-bold text-fg transition-colors hover:bg-surface-2"
            >
              Log in
            </Link>
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-bold text-white transition-colors hover:bg-brand-strong"
            >
              Get started free
            </Link>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
