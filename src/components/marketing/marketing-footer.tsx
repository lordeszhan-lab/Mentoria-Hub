"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { setLocale } from "@/server/locale/actions";

const LOCALES = ["EN", "RU", "KK"] as const;
type LocaleDisplay = (typeof LOCALES)[number];

function localeToDisplay(l: string): LocaleDisplay {
  const up = l.toUpperCase() as LocaleDisplay;
  return LOCALES.includes(up) ? up : "EN";
}

const FOOTER_LINKS = {
  "For students": [
    { href: "/opportunities", label: "Opportunity Catalog" },
    { href: "/roadmap", label: "Your Roadmap" },
    { href: "/courses", label: "Courses" },
    { href: "/leaderboard", label: "Streak & Progress" },
  ],
  "For mentors": [
    { href: "/for-schools", label: "School Dashboard" },
    { href: "/for-schools#analytics", label: "Student Analytics" },
    { href: "/for-schools#reporting", label: "Sponsor Reporting" },
    { href: "mailto:hello@mentoriahub.kz", label: "Contact us" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/blog", label: "Blog" },
    { href: "/careers", label: "Careers" },
    { href: "/press", label: "Press" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/cookies", label: "Cookie Policy" },
    { href: "/dpa", label: "Data Processing" },
  ],
} as const;

interface Props {
  activeLocale?: string;
}

export function MarketingFooter({ activeLocale = "en" }: Props) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const currentLocale = localeToDisplay(activeLocale);

  function handleLocaleSwitch(loc: LocaleDisplay) {
    if (loc === currentLocale) return;
    const newLocale = loc.toLowerCase();
    startTransition(async () => {
      await setLocale(newLocale);
      router.refresh();
    });
  }

  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-20">
        {/* Top row — brand + mission */}
        <div className="grid gap-12 border-b border-border/60 pb-12 md:grid-cols-12 md:gap-8">
          <div className="space-y-5 md:col-span-5">
            <Link
              href="/"
              className="weight-shift inline-flex items-center gap-2 font-bold"
            >
              <Image
                src="/mentoria-logo.png"
                alt=""
                width={24}
                height={24}
                className="size-6 object-contain"
              />
              <span>
                <span className="text-foreground">Mentoria</span>{" "}
                <span className="text-brand">Hub</span>
              </span>
            </Link>
            <p className="max-w-sm text-[14px] leading-relaxed text-muted-foreground">
              Turning every student&apos;s ambition into a clear, achievable
              roadmap — opportunities, courses, and an AI mentor, in one place.
            </p>
          </div>

          <div className="md:col-span-7 md:pl-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Ready to start?
            </p>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">
              Join thousands of students in Kazakhstan and beyond taking control
              of their academic future — one step at a time.
            </p>
            <div className="mt-4">
              <Link
                href="/auth/login?mode=signup"
                className="inline-flex h-9 items-center rounded-full bg-brand px-4 text-[13px] font-semibold text-white transition-colors hover:bg-brand-strong"
              >
                {t("getStartedFree")}
              </Link>
            </div>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-10 py-12 sm:grid-cols-4">
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {section}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[13.5px] text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between border-t border-border/60 pt-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            © {new Date().getFullYear()} Mentoria Hub. All rights reserved.
          </p>

          {/* Locale switcher */}
          <div className="inline-flex items-center gap-0.5 rounded-full bg-muted/60 p-0.5 ring-1 ring-inset ring-border/50">
            {LOCALES.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => handleLocaleSwitch(loc)}
                disabled={isPending}
                className={cn(
                  "relative rounded-full px-2.5 py-1 font-mono text-[11px]",
                  currentLocale === loc
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/80",
                )}
              >
                {currentLocale === loc && (
                  <motion.span
                    layoutId="locale-pill-footer"
                    className="absolute inset-0 rounded-full bg-background shadow-sm ring-1 ring-inset ring-border/60"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{loc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
