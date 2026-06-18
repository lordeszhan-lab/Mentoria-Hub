"use client";

import { useState, useEffect, useCallback } from "react";

// ── Utilities ─────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type PushStatus = "idle" | "loading" | "subscribed" | "unsubscribed" | "error";

export interface UsePushSubscriptionResult {
  /** true when the browser supports push AND (on iOS) the app is installed as PWA */
  isSupported: boolean;
  /** true when running on an iOS device */
  isIOS: boolean;
  /** true when the app is running in standalone (installed-PWA) mode */
  isStandalone: boolean;
  subscription: PushSubscription | null;
  status: PushStatus;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Manages the browser-side push subscription lifecycle.
 *
 * - On iOS: push requires the app to be installed as a PWA (Add to Home Screen).
 *   `isSupported` is false on iOS in Safari unless `isStandalone` is true.
 * - On Android / desktop: supported in any Chromium/Firefox browser.
 * - Subscriptions are persisted via `/api/push/subscribe`.
 */
export function usePushSubscription(): UsePushSubscriptionResult {
  const [isSupported, setIsSupported] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [status, setStatus] = useState<PushStatus>("idle");

  useEffect(() => {
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const hasSW = "serviceWorker" in navigator && "PushManager" in window;

    setIsIOS(!!ios);
    setIsStandalone(standalone);
    // On iOS, push only works after installation
    setIsSupported(hasSW && (!ios || standalone));

    if (!hasSW) {
      setStatus("unsubscribed");
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setSubscription(sub);
        setStatus(sub ? "subscribed" : "unsubscribed");
      })
      .catch(() => setStatus("error"));
  }, []);

  const subscribe = useCallback(async () => {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ) as unknown as ArrayBuffer,
      });
      const serialized = JSON.parse(JSON.stringify(sub)) as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serialized),
      });
      if (!res.ok) throw new Error("subscribe API failed");
      setSubscription(sub);
      setStatus("subscribed");
    } catch {
      setStatus("error");
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setStatus("loading");
    try {
      const endpoint = subscription?.endpoint;
      await subscription?.unsubscribe();
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
      setSubscription(null);
      setStatus("unsubscribed");
    } catch {
      setStatus("error");
    }
  }, [subscription]);

  return { isSupported, isIOS, isStandalone, subscription, status, subscribe, unsubscribe };
}
