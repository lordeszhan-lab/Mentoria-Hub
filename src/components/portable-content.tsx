/**
 * Renders structured lesson content blocks.
 *
 * The `content` column is stored as a JSON array of block objects.
 * Shape (all blocks have a `type` discriminator):
 *
 *   { type: "heading", level: 1|2|3, text: string }
 *   { type: "paragraph", text: string }
 *   { type: "callout", variant: "info"|"warning"|"tip"|"danger", text: string }
 *   { type: "code", language?: string, code: string }
 *   { type: "list", ordered?: boolean, items: string[] }
 *   { type: "divider" }
 *
 * Any unknown block type is silently skipped.
 */

import type { Json } from "@/lib/supabase/types";

// ── Block type definitions ────────────────────────────────────────────────────

interface HeadingBlock {
  type: "heading";
  level?: 1 | 2 | 3;
  text: string;
}

interface ParagraphBlock {
  type: "paragraph";
  text: string;
}

interface CalloutBlock {
  type: "callout";
  variant?: "info" | "warning" | "tip" | "danger";
  text: string;
}

interface CodeBlock {
  type: "code";
  language?: string;
  code: string;
}

interface ListBlock {
  type: "list";
  ordered?: boolean;
  items: string[];
}

interface DividerBlock {
  type: "divider";
}

type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | CalloutBlock
  | CodeBlock
  | ListBlock
  | DividerBlock;

// ── Callout styles ────────────────────────────────────────────────────────────

const CALLOUT_STYLES = {
  info: {
    bg: "#E0F4FE",
    border: "#1CB0F6",
    text: "#0369A1",
    icon: "ℹ",
  },
  tip: {
    bg: "#DCFCE7",
    border: "#16A34A",
    text: "#15803D",
    icon: "✦",
  },
  warning: {
    bg: "#FFF6D6",
    border: "#FFC800",
    text: "#A16207",
    icon: "⚠",
  },
  danger: {
    bg: "#FFE4E4",
    border: "#FF4B4B",
    text: "#B91C1C",
    icon: "✕",
  },
} as const;

// ── Block renderers ───────────────────────────────────────────────────────────

function Heading({ block }: { block: HeadingBlock }) {
  const level = block.level ?? 2;
  const cls =
    level === 1
      ? "text-2xl font-extrabold tracking-tight text-[--color-fg] mt-8 mb-3"
      : level === 2
        ? "text-xl font-bold text-[--color-fg] mt-6 mb-2"
        : "text-base font-bold text-[--color-fg] mt-5 mb-1";

  if (level === 1) return <h1 className={cls}>{block.text}</h1>;
  if (level === 2) return <h2 className={cls}>{block.text}</h2>;
  return <h3 className={cls}>{block.text}</h3>;
}

function Paragraph({ block }: { block: ParagraphBlock }) {
  return (
    <p className="my-3 text-base leading-relaxed text-[--color-fg] max-w-[68ch]">
      {block.text}
    </p>
  );
}

function Callout({ block }: { block: CalloutBlock }) {
  const variant = block.variant ?? "info";
  const s = CALLOUT_STYLES[variant] ?? CALLOUT_STYLES.info;

  return (
    <div
      className="my-4 flex gap-3 rounded-xl border-l-4 p-4"
      style={{ background: s.bg, borderColor: s.border }}
      role="note"
    >
      <span
        className="shrink-0 text-lg leading-none font-bold select-none"
        style={{ color: s.text }}
        aria-hidden
      >
        {s.icon}
      </span>
      <p className="text-sm leading-relaxed" style={{ color: s.text }}>
        {block.text}
      </p>
    </div>
  );
}

function Code({ block }: { block: CodeBlock }) {
  return (
    <div className="my-4 overflow-hidden rounded-xl" style={{ background: "#1A1A1A" }}>
      {block.language && (
        <div className="border-b border-white/10 px-4 py-1.5">
          <span className="text-[11px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-wider">
            {block.language}
          </span>
        </div>
      )}
      <pre className="overflow-x-auto p-4">
        <code className="font-mono text-sm leading-relaxed text-[#E5E7EB] whitespace-pre">
          {block.code}
        </code>
      </pre>
    </div>
  );
}

function BulletList({ block }: { block: ListBlock }) {
  const El = block.ordered ? "ol" : "ul";
  return (
    <El
      className={`my-3 space-y-1.5 pl-5 text-base text-[--color-fg] ${
        block.ordered ? "list-decimal" : "list-disc"
      }`}
    >
      {block.items.map((item, i) => (
        <li key={i} className="leading-relaxed">
          {item}
        </li>
      ))}
    </El>
  );
}

function Divider() {
  return <hr className="my-6 border-[--color-border]" />;
}

// ── Main component ────────────────────────────────────────────────────────────

function renderBlock(block: ContentBlock, i: number) {
  switch (block.type) {
    case "heading":
      return <Heading key={i} block={block} />;
    case "paragraph":
      return <Paragraph key={i} block={block} />;
    case "callout":
      return <Callout key={i} block={block} />;
    case "code":
      return <Code key={i} block={block} />;
    case "list":
      return <BulletList key={i} block={block} />;
    case "divider":
      return <Divider key={i} />;
    default:
      return null;
  }
}

export function PortableContent({ content }: { content: Json }) {
  if (!content) return null;

  let blocks: ContentBlock[];
  if (Array.isArray(content)) {
    blocks = content as unknown as ContentBlock[];
  } else if (typeof content === "string") {
    // Plain string fallback — render as paragraph.
    return (
      <div className="prose-like">
        <p className="my-3 text-base leading-relaxed text-[--color-fg]">{content}</p>
      </div>
    );
  } else {
    return null;
  }

  return (
    <div className="lesson-content">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}
