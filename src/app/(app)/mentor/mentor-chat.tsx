"use client";

/**
 * MentorChat — premium AI mentor chat.
 *
 * Design language: same white-card / brand-green-accent system as onboarding.
 * No sparkles, no emoji, no decorative symbols — thin lucide outline icons only.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Bot, MessageCircle, ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { MentorMessageRow } from "@/lib/supabase/types";

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  initialMessages: MentorMessageRow[];
  userName: string | null;
}

// ── Internal message type ─────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

// ── Thinking dots ─────────────────────────────────────────────────────────────

function ThinkingDots({ reduced }: { reduced: boolean }) {
  return (
    <div className="flex items-center gap-1.5 py-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-2 rounded-full"
          style={{ background: "var(--color-brand)" }}
          animate={
            reduced
              ? { opacity: [0.4, 0.9, 0.4] }
              : { y: [0, -4, 0], opacity: [0.4, 1, 0.4] }
          }
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.16,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Message card ──────────────────────────────────────────────────────────────

function MessageCard({
  msg,
  reduced,
}: {
  msg: ChatMessage;
  reduced: boolean;
}) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {/* Mentor avatar chip */}
      {!isUser && (
        <div
          className="flex-shrink-0 size-8 rounded-xl flex items-center justify-center mt-0.5"
          style={{ backgroundColor: "var(--color-brand-soft)" }}
          aria-hidden
        >
          <Bot
            size={15}
            strokeWidth={1.6}
            style={{ color: "var(--color-brand)" }}
          />
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[76%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed",
          isUser ? "rounded-tr-sm" : "rounded-tl-sm border border-[--color-border]",
        )}
        style={
          isUser
            ? {
                backgroundColor: "rgba(22,163,74,0.09)",
                color: "var(--color-fg)",
              }
            : {
                backgroundColor: "var(--color-surface)",
                color: "var(--color-fg)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }
        }
      >
        {msg.streaming && !msg.content ? (
          <ThinkingDots reduced={reduced} />
        ) : (
          <span className="whitespace-pre-wrap break-words">
            {msg.content}
            {msg.streaming && (
              <span
                className="inline-block w-[2px] h-[1em] ml-0.5 align-[-0.05em] rounded-sm animate-pulse"
                style={{ backgroundColor: "var(--color-brand)" }}
                aria-hidden
              />
            )}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Quick action card ─────────────────────────────────────────────────────────

function QuickActionCard({
  label,
  onClick,
  disabled,
  reduced,
  delay,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  reduced: boolean;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "w-full text-left rounded-2xl border px-4 py-3.5 text-sm font-semibold",
        "transition-all duration-200 active:scale-[0.97] disabled:opacity-50",
        hovered && !disabled ? "-translate-y-0.5" : "",
      )}
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: hovered && !disabled ? "var(--color-brand)" : "var(--color-border)",
        color: hovered && !disabled ? "var(--color-brand)" : "var(--color-fg-muted)",
        boxShadow: hovered && !disabled
          ? "0 2px 8px rgba(22,163,74,0.10)"
          : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {label}
    </motion.button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function MentorChat({ initialMessages, userName }: Props) {
  const t = useTranslations("mentor");
  const reduced = useReducedMotion() ?? false;

  const firstName = userName?.split(" ")[0] ?? null;
  const quickActions = [t("quick1"), t("quick2"), t("quick3"), t("quick4")];

  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })),
  );
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
    });
  }, [reduced]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      setError(null);
      setIsSending(true);

      const userMsgId = `tmp-user-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: trimmed },
      ]);
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";

      const asstMsgId = `tmp-asst-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: asstMsgId, role: "assistant", content: "", streaming: true },
      ]);

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/mentor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstMsgId ? { ...m, content: accumulated } : m,
            ),
          );
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsgId
              ? { ...m, content: accumulated, streaming: false }
              : m,
          ),
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("[MentorChat] send error", err);
        setError(t("errorMsg"));
        setMessages((prev) => prev.filter((m) => m.id !== asstMsgId));
      } finally {
        setIsSending(false);
        abortRef.current = null;
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [isSending, t],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: "var(--color-canvas)" }}
    >
      {/* ── Sticky header ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-[--color-border] sticky top-0 z-10"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="size-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--color-brand-soft)" }}
          >
            <Bot
              size={18}
              strokeWidth={1.6}
              style={{ color: "var(--color-brand)" }}
            />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[--color-fg] leading-tight">
              AI Mentor
            </h1>
            <p
              className="text-xs leading-tight"
              style={{ color: "var(--color-fg-muted)" }}
            >
              {t("headerSubtitle")}
            </p>
          </div>
        </div>

        {/* Online indicator */}
        <div className="flex items-center gap-1.5">
          <motion.span
            className="size-2 rounded-full"
            style={{ backgroundColor: "var(--color-brand)" }}
            animate={reduced ? {} : { opacity: [1, 0.35, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: "var(--color-fg-faint)" }}
          >
            {t("online")}
          </span>
        </div>
      </div>

      {/* ── Message area ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Welcome / empty state */}
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 pb-4">

            {/* Icon chip */}
            <motion.div
              initial={reduced ? false : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="size-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--color-brand-soft)" }}
            >
              <MessageCircle
                size={30}
                strokeWidth={1.4}
                style={{ color: "var(--color-brand)" }}
              />
            </motion.div>

            {/* Heading + subtitle */}
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-center space-y-2 px-4"
            >
              <h2 className="text-2xl font-extrabold text-[--color-fg]">
                {firstName
                  ? `${firstName}, ${t("welcomeQuestion")}`
                  : t("welcomeQuestion")}
              </h2>
              <p
                className="text-sm max-w-sm mx-auto"
                style={{ color: "var(--color-fg-muted)" }}
              >
                {t("welcomeSubtitle")}
              </p>
            </motion.div>

            {/* Quick actions 2×2 grid */}
            <div
              className="w-full max-w-md grid grid-cols-2 gap-3 px-2"
              aria-label="Quick questions"
            >
              {quickActions.map((action, i) => (
                <QuickActionCard
                  key={action}
                  label={action}
                  onClick={() => sendMessage(action)}
                  disabled={isSending}
                  reduced={reduced}
                  delay={0.18 + i * 0.07}
                />
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageCard key={msg.id} msg={msg} reduced={reduced} />
          ))}
        </AnimatePresence>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm border"
              style={{
                backgroundColor: "rgba(255,75,75,0.06)",
                borderColor: "rgba(255,75,75,0.18)",
                color: "var(--color-accent-red)",
              }}
            >
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-xs font-semibold underline opacity-70 hover:opacity-100 flex-shrink-0 transition-opacity"
              >
                {t("dismissError")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      <div
        className="flex-shrink-0 border-t border-[--color-border] px-4 sm:px-6 py-4"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div
          className="flex items-end gap-3 rounded-full border px-5 py-3
            transition-colors duration-150 focus-within:border-[--color-brand]"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-canvas)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t("inputPlaceholder")}
            rows={1}
            disabled={isSending}
            aria-label={t("sendLabel")}
            className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none
              placeholder-[--color-fg-faint] text-[--color-fg] disabled:opacity-60"
            style={{ maxHeight: 140, minHeight: 22 }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isSending || !input.trim()}
            aria-label={t("sendLabel")}
            className={cn(
              "flex-shrink-0 size-8 rounded-full flex items-center justify-center",
              "transition-all duration-150",
              isSending || !input.trim()
                ? "opacity-35 cursor-not-allowed"
                : "hover:scale-105 active:scale-90",
            )}
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            <ArrowUp size={15} strokeWidth={2.2} color="white" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
