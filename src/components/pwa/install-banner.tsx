"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Download, Share } from "lucide-react";

// How long (ms) to wait before offering again after dismissal
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DISMISSED_KEY = "mentoria-install-dismissed-at";

// Extend Window to include beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type BannerMode = "android" | "ios" | null;

export function InstallBanner() {
  const [mode, setMode] = useState<BannerMode>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already installed / running in standalone
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if user dismissed recently
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt && Date.now() - Number(dismissedAt) < SNOOZE_MS) return;

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;

    if (isIOS) {
      // iOS Safari: beforeinstallprompt never fires — show manual instructions
      setMode("ios");
      setVisible(true);
      return;
    }

    // Android / Chrome / Edge: listen for beforeinstallprompt
    function handlePrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setMode("android");
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    } else {
      dismiss();
    }
    setDeferredPrompt(null);
  }

  if (!visible || mode === null) return null;

  return (
    <div
      role="banner"
      aria-label="Install Mentoria Hub"
      className="fixed bottom-[env(safe-area-inset-bottom,0px)] left-0 right-0 z-50 mx-auto mb-4 flex max-w-md items-start gap-3 rounded-2xl px-4 py-3.5 shadow-xl"
      style={{
        background: "var(--color-surface, #fff)",
        border: "1px solid var(--color-border, #E8ECEA)",
        boxShadow: "0 8px 32px -4px rgba(22,163,74,0.18), 0 2px 8px -2px rgba(0,0,0,0.08)",
        margin: "0 16px 16px",
      }}
    >
      {/* App icon */}
      <div className="shrink-0 rounded-xl overflow-hidden size-11">
        <Image
          src="/icon-192.png"
          alt="Mentoria Hub icon"
          width={44}
          height={44}
          className="size-11 object-cover"
        />
      </div>

      {/* Text + CTA */}
      <div className="flex-1 min-w-0">
        {mode === "android" ? (
          <>
            <p className="text-[13px] font-bold" style={{ color: "var(--color-fg)" }}>
              Install Mentoria Hub
            </p>
            <p className="text-[12px] leading-snug mt-0.5" style={{ color: "var(--color-fg-muted)" }}>
              Get the full app experience — works offline too.
            </p>
            <button
              onClick={install}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3.5 h-7 text-[12px] font-bold text-white transition-all active:scale-[0.97]"
              style={{ background: "var(--color-brand, #16A34A)" }}
            >
              <Download size={12} />
              Install
            </button>
          </>
        ) : (
          <>
            <p className="text-[13px] font-bold" style={{ color: "var(--color-fg)" }}>
              Add to Home Screen
            </p>
            <p className="text-[12px] leading-snug mt-0.5" style={{ color: "var(--color-fg-muted)" }}>
              Tap{" "}
              <span className="inline-flex items-center gap-0.5 font-semibold" style={{ color: "var(--color-brand)" }}>
                <Share size={11} />
                Share
              </span>
              {" "}→{" "}
              <strong>Add to Home Screen</strong> in Safari for an app-like experience.
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--color-fg-faint)" }}>
              Note: full install &amp; push notifications work best on Android.
            </p>
          </>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        aria-label="Dismiss install banner"
        className="shrink-0 rounded-full p-1 transition-colors hover:bg-[--color-border]/50"
        style={{ color: "var(--color-fg-faint)" }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
