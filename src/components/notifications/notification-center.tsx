"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  BellOff,
  Trophy,
  Calendar,
  Newspaper,
  Zap,
  CheckCheck,
  Loader2,
  Smartphone,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
} from "@/server/notifications/actions";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import type { NotificationRow, NotificationKind } from "@/lib/supabase/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Kind icons + colours ──────────────────────────────────────────────────────

const KIND_META: Record<NotificationKind, { Icon: React.ElementType; color: string; bg: string }> =
  {
    achievement: { Icon: Trophy, color: "#D97706", bg: "rgba(217,119,6,0.10)" },
    deadline: { Icon: Calendar, color: "#DC2626", bg: "rgba(220,38,38,0.10)" },
    digest: { Icon: Newspaper, color: "#1CB0F6", bg: "rgba(28,176,246,0.10)" },
    system: { Icon: Zap, color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
  };

// ── Single notification row ───────────────────────────────────────────────────

function NotificationItem({ n }: { n: NotificationRow }) {
  const meta = KIND_META[n.kind] ?? KIND_META.system;
  const { Icon } = meta;
  const isUnread = !n.read_at;

  const inner = (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 transition-colors hover:bg-[--color-border]/30",
        isUnread && "bg-[--color-surface-2]",
      )}
    >
      <div
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: meta.bg }}
      >
        <Icon size={15} style={{ color: meta.color }} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-[13px] font-semibold leading-tight"
          style={{ color: "var(--color-fg)" }}
        >
          {n.title}
        </p>
        <p
          className="mt-0.5 line-clamp-2 text-[12px] leading-snug"
          style={{ color: "var(--color-fg-muted)" }}
        >
          {n.body}
        </p>
        <p
          className="mt-1 text-[11px]"
          style={{ color: "var(--color-fg-faint)" }}
        >
          {relativeTime(n.created_at)}
        </p>
      </div>
      {isUnread && (
        <div
          className="mt-2 size-2 shrink-0 rounded-full"
          style={{ background: "var(--color-accent-blue)" }}
          aria-hidden
        />
      )}
    </div>
  );

  if (n.url) {
    return (
      <Link href={n.url} className="block" tabIndex={0}>
        {inner}
      </Link>
    );
  }
  return <div>{inner}</div>;
}

// ── Push subscription affordance ─────────────────────────────────────────────

function PushAffordance() {
  const { isSupported, isIOS, isStandalone, status, subscribe, unsubscribe } =
    usePushSubscription();

  if (status === "subscribed") {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-[--color-border]">
        <span
          className="flex items-center gap-1.5 text-[11px]"
          style={{ color: "var(--color-fg-faint)" }}
        >
          <Bell size={11} aria-hidden />
          Push enabled
        </span>
        <button
          onClick={unsubscribe}
          className="text-[11px] hover:underline"
          style={{ color: "var(--color-fg-faint)" }}
        >
          Disable
        </button>
      </div>
    );
  }

  if (isIOS && !isStandalone) {
    return (
      <div
        className="flex items-start gap-2 px-4 py-3 border-t border-[--color-border]"
        style={{ background: "rgba(28,176,246,0.06)" }}
      >
        <Smartphone size={14} className="mt-0.5 shrink-0" style={{ color: "#1CB0F6" }} />
        <p className="text-[11px] leading-snug" style={{ color: "var(--color-fg-muted)" }}>
          To enable push on iOS, tap{" "}
          <strong>Share → Add to Home Screen</strong>, then open the app.
        </p>
      </div>
    );
  }

  if (!isSupported || status === "error") return null;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-[--color-border]">
      <span
        className="flex items-center gap-1.5 text-[11px]"
        style={{ color: "var(--color-fg-faint)" }}
      >
        <BellOff size={11} aria-hidden />
        Push off
      </span>
      <button
        onClick={subscribe}
        disabled={status === "loading"}
        className="text-[11px] font-semibold transition-colors hover:underline"
        style={{ color: "var(--color-accent-blue)" }}
      >
        {status === "loading" ? "…" : "Enable"}
      </button>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export interface NotificationCenterProps {
  iconSize?: number;
  /**
   * Full className for the trigger button.
   * When provided, replaces the default size + hover styles entirely.
   * The badge span is still positioned absolutely inside the button.
   */
  buttonClassName?: string;
}

export function NotificationCenter({
  iconSize = 18,
  buttonClassName,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  // Fetch unread count on mount for the badge
  useEffect(() => {
    getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, []);

  const handleOpenChange = useCallback(
    async (next: boolean) => {
      setOpen(next);
      if (!next) return;

      setLoading(true);
      try {
        const list = await getNotifications();
        setNotifications(list);
        const hasUnread = list.some((n) => !n.read_at);
        if (hasUnread) {
          setUnreadCount(0);
          startTransition(async () => {
            await markAllRead();
            setNotifications((prev) =>
              prev
                ? prev.map((n) => ({
                    ...n,
                    read_at: n.read_at ?? new Date().toISOString(),
                  }))
                : prev,
            );
          });
        }
      } catch {
        // non-fatal
      } finally {
        setLoading(false);
      }
    },
    [startTransition],
  );

  const displayCount = unreadCount > 0 ? unreadCount : null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        aria-label={
          displayCount
            ? `Notifications — ${displayCount} unread`
            : "Notifications"
        }
        className={
          buttonClassName
            ? cn("relative flex items-center justify-center", buttonClassName)
            : "relative flex items-center justify-center size-9 rounded-xl text-[--color-fg-muted] hover:bg-[--color-border]/60 transition-colors active:scale-[0.95]"
        }
      >
        <Bell size={iconSize} strokeWidth={1.8} aria-hidden />
        {displayCount !== null && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1
              text-[10px] font-bold text-white leading-none"
            style={{ background: "var(--color-accent-red, #EF4444)" }}
            aria-hidden
          >
            {displayCount > 99 ? "99+" : displayCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 overflow-hidden"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-[--color-border]"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <h3 className="text-[13px] font-bold" style={{ color: "var(--color-fg)" }}>
            Notifications
          </h3>
          {notifications && notifications.some((n) => n.read_at) && (
            <span
              className="flex items-center gap-1 text-[11px]"
              style={{ color: "var(--color-fg-faint)" }}
            >
              <CheckCheck size={11} aria-hidden />
              All read
            </span>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2
              size={20}
              className="animate-spin"
              style={{ color: "var(--color-fg-faint)" }}
            />
          </div>
        ) : notifications === null ? null : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Bell size={28} strokeWidth={1.4} style={{ color: "var(--color-fg-faint)" }} />
            <p className="mt-3 text-[13px] font-semibold" style={{ color: "var(--color-fg-muted)" }}>
              All caught up
            </p>
            <p className="mt-1 text-[12px]" style={{ color: "var(--color-fg-faint)" }}>
              No notifications yet
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[360px]">
            <div className="divide-y divide-[--color-border]">
              {notifications.map((n) => (
                <NotificationItem key={n.id} n={n} />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Push affordance */}
        <PushAffordance />
      </PopoverContent>
    </Popover>
  );
}
