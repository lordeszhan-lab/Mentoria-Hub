"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ease, dur } from "@/lib/motion/tokens";
import { useTranslations } from "next-intl";
import { setLocale } from "@/server/locale/actions";

interface Props {
  isAuthed: boolean;
  activeLocale?: string;
}

function subscribeScroll(callback: () => void): () => void {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}
function getScrolledSnapshot(): boolean {
  return window.scrollY > 8;
}
function getServerScrolledSnapshot(): boolean {
  return false;
}

const LOCALES = ["EN", "RU", "KK"] as const;
type LocaleDisplay = (typeof LOCALES)[number];

function localeToDisplay(l: string): LocaleDisplay {
  const up = l.toUpperCase() as LocaleDisplay;
  return LOCALES.includes(up) ? up : "EN";
}

export function MarketingHeader({ isAuthed, activeLocale = "en" }: Props) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    getScrolledSnapshot,
    getServerScrolledSnapshot,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [locale, setLocaleDisplay] = useState<LocaleDisplay>(
    localeToDisplay(activeLocale),
  );

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  function handleLocaleSwitch(loc: LocaleDisplay) {
    if (loc === locale) return;
    setLocaleDisplay(loc);
    const newLocale = loc.toLowerCase();
    startTransition(async () => {
      await setLocale(newLocale);
      router.refresh();
    });
  }

  const NAV_LINKS = [
    { href: "/#how-it-works", label: t("howItWorks") },
    { href: "/#features", label: t("features") },
    { href: "/#comparison", label: t("compare") },
    { href: "/pricing", label: t("pricing") },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: dur.slow, ease: ease.out, delay: 0.1 }}
        className={cn(
          "sticky top-0 z-40 w-full transition-[background-color,backdrop-filter,border-color] duration-300 ease-out",
          scrolled || menuOpen
            ? "border-b border-border/60 bg-background/75 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6">
          {/* Left — logo */}
          <Link
            href="/"
            aria-label="Mentoria Hub home"
            className="weight-shift inline-flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => setMenuOpen(false)}
          >
            <img
              src="/mentoria-logo.png"
              alt=""
              width={32}
              height={32}
              className="size-7 object-contain"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <span className="font-bold tracking-tight text-[15px]">
              <span className="text-foreground">Mentoria</span>{" "}
              <span className="text-brand">Hub</span>
            </span>
          </Link>

          {/* Center — nav links */}
          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right — locale switcher + auth */}
          <div className="flex items-center justify-end gap-2">
            {/* Locale pill switcher — desktop only */}
            <div className="hidden md:flex">
              <div className="inline-flex items-center gap-0.5 rounded-full bg-muted/60 p-0.5 ring-1 ring-inset ring-border/50">
                {LOCALES.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => handleLocaleSwitch(loc)}
                    disabled={isPending}
                    className={cn(
                      "relative rounded-full px-2.5 py-1 font-mono text-[11px]",
                      locale === loc
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground/80",
                    )}
                  >
                    {locale === loc && (
                      <motion.span
                        layoutId="locale-pill"
                        className="absolute inset-0 rounded-full bg-background shadow-sm ring-1 ring-inset ring-border/60"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-10">{loc}</span>
                  </button>
                ))}
              </div>
            </div>

            {isAuthed ? (
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "h-8 px-3.5 text-[13px]",
                )}
              >
                {t("openApp")}
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login?mode=signin"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "hidden h-8 px-3 text-[13px] sm:inline-flex",
                  )}
                >
                  {t("logIn")}
                </Link>
                <Link
                  href="/auth/login?mode=signup"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "hidden h-8 px-3.5 text-[13px] sm:inline-flex",
                  )}
                >
                  {t("getStartedFree")}
                </Link>
              </>
            )}
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex size-9 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur.fast, ease: ease.out }}
            className="fixed inset-0 top-16 z-30 bg-background/95 backdrop-blur-xl md:hidden"
          >
            <motion.nav
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{
                hidden: {},
                show: {
                  transition: { staggerChildren: 0.05, delayChildren: 0.05 },
                },
              }}
              className="flex h-full flex-col px-6 pb-12 pt-8"
            >
              <ul className="flex flex-col gap-1">
                {NAV_LINKS.map((l) => (
                  <motion.li
                    key={l.href}
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: dur.base, ease: ease.out },
                      },
                    }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setMenuOpen(false)}
                      className="block py-3 text-[24px] font-semibold tracking-tight transition-colors hover:text-muted-foreground"
                    >
                      {l.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: dur.base, ease: ease.out },
                  },
                }}
                className="mt-auto flex flex-col gap-3 border-t border-border/60 pt-8"
              >
                {isAuthed ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "h-12 w-full text-[14px]",
                    )}
                  >
                    {t("openApp")}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/auth/login?mode=signup"
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "h-12 w-full text-[14px]",
                      )}
                    >
                      {t("getStartedFree")}
                    </Link>
                    <Link
                      href="/auth/login?mode=signin"
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "h-12 w-full text-[14px]",
                      )}
                    >
                      {t("logIn")}
                    </Link>
                  </>
                )}
                {/* Locale switcher — mobile */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-0.5 rounded-full bg-muted/60 p-0.5 ring-1 ring-inset ring-border/50">
                    {LOCALES.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => { handleLocaleSwitch(loc); setMenuOpen(false); }}
                        disabled={isPending}
                        className={cn(
                          "relative rounded-full px-3 py-1 font-mono text-[11px]",
                          locale === loc
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground/80",
                        )}
                      >
                        {locale === loc && (
                          <motion.span
                            layoutId="locale-pill-mobile"
                            className="absolute inset-0 rounded-full bg-background shadow-sm ring-1 ring-inset ring-border/60"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                          />
                        )}
                        <span className="relative z-10">{loc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
