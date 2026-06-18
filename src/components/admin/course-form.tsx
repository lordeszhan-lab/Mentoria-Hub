"use client";

/**
 * CourseForm — nested editor for course metadata + modules/lessons + quizzes.
 * Admin design: businesslike, no joy layer.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import {
  CONTENT_STATUS_VALUES,
  COURSE_LEVEL_VALUES,
  type CourseFormValues,
  type ModuleFormValues,
  type LessonFormValues,
  type QuizQuestion,
  type ContentBlock,
} from "@/lib/zod/admin";
import type { CategoryRow } from "@/lib/supabase/types";
import { createCourse, updateCourse } from "@/server/admin/courses";
import type { CourseWithModules } from "@/server/admin/courses";

// ── Shared input styles ────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-[--color-border] bg-[--color-surface] px-3 py-2 text-sm text-[--color-fg] placeholder-[--color-fg-faint] focus:outline-none focus:ring-2 focus:ring-[--color-brand]/30 focus:border-[--color-brand]/60 transition";
const selectCls =
  "w-full rounded-xl border border-[--color-border] bg-[--color-surface] px-3 py-2 text-sm text-[--color-fg] focus:outline-none focus:ring-2 focus:ring-[--color-brand]/30 transition";

function Label({
  htmlFor,
  children,
  optional,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold text-[--color-fg-muted] mb-1.5 uppercase tracking-wide"
    >
      {children}
      {optional && (
        <span className="ml-1 font-normal text-[--color-fg-faint]">(optional)</span>
      )}
    </label>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-[--color-fg-faint] pt-5 pb-1 border-b border-[--color-border]">
      {children}
    </h2>
  );
}

// ── Tags chip input (reused pattern) ──────────────────────────────────────────

function TagsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");
  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInput("");
  }
  return (
    <div className="flex flex-wrap gap-1.5 min-h-[40px] rounded-xl border border-border bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-primary/25 focus-within:border-primary/40 transition-all duration-200">
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 h-6 px-2.5 rounded-full text-xs font-semibold bg-primary/10 text-primary"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="hover:opacity-70"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "," || e.key === " ") {
            e.preventDefault();
            addTag(input);
          }
          if (e.key === "Backspace" && !input && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={value.length === 0 ? "Type a tag and press Enter…" : ""}
        className="flex-1 min-w-[120px] text-sm text-[--color-fg] placeholder-[--color-fg-faint] bg-transparent outline-none border-none"
      />
    </div>
  );
}

// ── Content blocks editor ──────────────────────────────────────────────────────

const BLOCK_TYPES = [
  { type: "paragraph", label: "Paragraph" },
  { type: "heading", label: "Heading" },
  { type: "callout", label: "Callout" },
  { type: "code", label: "Code block" },
  { type: "list", label: "List" },
  { type: "divider", label: "Divider" },
] as const;

function ContentBlockEditor({
  blocks,
  onChange,
}: {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}) {
  function update(i: number, block: ContentBlock) {
    const next = [...blocks];
    next[i] = block;
    onChange(next);
  }
  function remove(i: number) {
    onChange(blocks.filter((_, idx) => idx !== i));
  }
  function add(type: ContentBlock["type"]) {
    let block: ContentBlock;
    switch (type) {
      case "paragraph": block = { type: "paragraph", text: "" }; break;
      case "heading": block = { type: "heading", level: 2, text: "" }; break;
      case "callout": block = { type: "callout", variant: "info", text: "" }; break;
      case "code": block = { type: "code", language: "", code: "" }; break;
      case "list": block = { type: "list", ordered: false, items: [""] }; break;
      case "divider": block = { type: "divider" }; break;
      default: block = { type: "paragraph", text: "" };
    }
    onChange([...blocks, block]);
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <div
          key={i}
          className="relative rounded-xl border border-[--color-border] bg-[--color-surface-2] p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[--color-fg-faint]">
              {block.type}
            </span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-[--color-fg-faint] hover:text-[--color-accent-red] transition-colors"
              aria-label="Remove block"
            >
              <Trash2 size={12} strokeWidth={2} aria-hidden />
            </button>
          </div>

          {block.type === "paragraph" && (
            <textarea
              value={block.text}
              onChange={(e) => update(i, { ...block, text: e.target.value })}
              rows={2}
              className={inputCls}
              placeholder="Paragraph text…"
            />
          )}

          {block.type === "heading" && (
            <div className="flex gap-2">
              <select
                value={block.level ?? 2}
                onChange={(e) => update(i, { ...block, level: parseInt(e.target.value) as 1 | 2 | 3 })}
                className="w-20 rounded-xl border border-[--color-border] bg-[--color-surface] px-2 py-1.5 text-sm focus:outline-none"
              >
                <option value={1}>H1</option>
                <option value={2}>H2</option>
                <option value={3}>H3</option>
              </select>
              <input
                type="text"
                value={block.text}
                onChange={(e) => update(i, { ...block, text: e.target.value })}
                className={`${inputCls} flex-1`}
                placeholder="Heading text…"
              />
            </div>
          )}

          {block.type === "callout" && (
            <div className="space-y-2">
              <select
                value={block.variant ?? "info"}
                onChange={(e) => update(i, { ...block, variant: e.target.value as ContentBlock & { type: "callout" } extends { variant?: infer V } ? NonNullable<V> : never })}
                className="w-32 rounded-xl border border-[--color-border] bg-[--color-surface] px-2 py-1.5 text-sm focus:outline-none"
              >
                {["info", "tip", "warning", "danger"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <textarea
                value={block.text}
                onChange={(e) => update(i, { ...block, text: e.target.value })}
                rows={2}
                className={inputCls}
                placeholder="Callout text…"
              />
            </div>
          )}

          {block.type === "code" && (
            <div className="space-y-2">
              <input
                type="text"
                value={block.language ?? ""}
                onChange={(e) => update(i, { ...block, language: e.target.value })}
                className={inputCls}
                placeholder="Language (e.g. javascript, python)"
              />
              <textarea
                value={block.code}
                onChange={(e) => update(i, { ...block, code: e.target.value })}
                rows={4}
                className={`${inputCls} font-mono text-xs`}
                placeholder="Code…"
              />
            </div>
          )}

          {block.type === "list" && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-[--color-fg-muted]">
                <input
                  type="checkbox"
                  checked={block.ordered ?? false}
                  onChange={(e) => update(i, { ...block, ordered: e.target.checked })}
                  className="rounded"
                />
                Ordered list
              </label>
              {block.items.map((item, j) => (
                <div key={j} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const items = [...block.items];
                      items[j] = e.target.value;
                      update(i, { ...block, items });
                    }}
                    className={`${inputCls} flex-1`}
                    placeholder={`Item ${j + 1}…`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const items = block.items.filter((_, idx) => idx !== j);
                      update(i, { ...block, items });
                    }}
                    className="text-[--color-fg-faint] hover:text-[--color-accent-red] shrink-0"
                    aria-label="Remove item"
                  >
                    <Trash2 size={12} strokeWidth={2} aria-hidden />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => update(i, { ...block, items: [...block.items, ""] })}
                className="text-xs text-[--color-brand] hover:underline"
              >
                + Add item
              </button>
            </div>
          )}

          {block.type === "divider" && (
            <hr className="border-[--color-border]" />
          )}
        </div>
      ))}

      {/* Add block buttons */}
      <div className="flex flex-wrap gap-2">
        {BLOCK_TYPES.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => add(type)}
            className="h-7 px-3 rounded-full border border-[--color-border] text-xs font-semibold text-[--color-fg-muted] hover:text-[--color-fg] hover:border-[--color-fg]/30 transition-colors"
          >
            + {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Quiz editor ────────────────────────────────────────────────────────────────

function QuizEditor({
  questions,
  onChange,
}: {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}) {
  function updateQ(i: number, q: QuizQuestion) {
    const next = [...questions];
    next[i] = q;
    onChange(next);
  }
  function removeQ(i: number) {
    onChange(questions.filter((_, idx) => idx !== i));
  }
  function addQ() {
    onChange([
      ...questions,
      { question: "", options: ["", ""], correct_index: 0, explanation: "" },
    ]);
  }

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div
          key={qi}
          className="rounded-xl border border-[--color-border] bg-[--color-surface-2] p-3 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[--color-fg-muted]">
              Question {qi + 1}
            </span>
            <button
              type="button"
              onClick={() => removeQ(qi)}
              className="text-[--color-fg-faint] hover:text-[--color-accent-red] transition-colors"
              aria-label="Remove question"
            >
              <Trash2 size={12} strokeWidth={2} aria-hidden />
            </button>
          </div>

          <input
            type="text"
            value={q.question}
            onChange={(e) => updateQ(qi, { ...q, question: e.target.value })}
            className={inputCls}
            placeholder="Question text…"
          />

          {q.options.map((opt, oi) => (
            <div key={oi} className="flex gap-2 items-center">
              <input
                type="radio"
                name={`correct-${qi}`}
                checked={q.correct_index === oi}
                onChange={() => updateQ(qi, { ...q, correct_index: oi })}
                className="shrink-0 accent-green-600"
                title="Mark as correct answer"
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const options = [...q.options];
                  options[oi] = e.target.value;
                  updateQ(qi, { ...q, options });
                }}
                className={`${inputCls} flex-1`}
                placeholder={`Option ${oi + 1}…`}
              />
              {q.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => {
                    const options = q.options.filter((_, idx) => idx !== oi);
                    const ci = q.correct_index >= options.length ? 0 : q.correct_index;
                    updateQ(qi, { ...q, options, correct_index: ci });
                  }}
                  className="text-[--color-fg-faint] hover:text-[--color-accent-red] shrink-0"
                  aria-label="Remove option"
                >
                  <Trash2 size={12} strokeWidth={2} aria-hidden />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateQ(qi, { ...q, options: [...q.options, ""] })}
            className="text-xs text-[--color-brand] hover:underline"
          >
            + Add option
          </button>

          <input
            type="text"
            value={q.explanation ?? ""}
            onChange={(e) => updateQ(qi, { ...q, explanation: e.target.value })}
            className={inputCls}
            placeholder="Explanation (shown after answer)…"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addQ}
        className="h-8 px-4 rounded-xl border border-[--color-border] text-xs font-semibold text-[--color-brand] hover:bg-[--color-brand-soft] transition-colors"
      >
        + Add question
      </button>
    </div>
  );
}

// ── Lesson editor ──────────────────────────────────────────────────────────────

function LessonEditor({
  lesson,
  index,
  onChange,
  onRemove,
}: {
  lesson: LessonFormValues;
  index: number;
  onChange: (l: LessonFormValues) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showQuiz, setShowQuiz] = useState(
    (lesson.quiz?.length ?? 0) > 0,
  );

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface]">
      {/* Lesson header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical
          size={14}
          strokeWidth={1.5}
          className="text-[--color-fg-faint] shrink-0 cursor-grab"
          aria-hidden
        />
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown size={13} strokeWidth={2} className="shrink-0 text-[--color-fg-muted]" aria-hidden />
          ) : (
            <ChevronRight size={13} strokeWidth={2} className="shrink-0 text-[--color-fg-muted]" aria-hidden />
          )}
          <span className="text-xs font-semibold text-[--color-fg-muted] shrink-0">
            {index + 1}.
          </span>
          <span className="text-sm font-semibold text-[--color-fg] truncate">
            {lesson.title || `Lesson ${index + 1}`}
          </span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-[--color-fg-faint] hover:text-[--color-accent-red] transition-colors"
          aria-label="Remove lesson"
        >
          <Trash2 size={13} strokeWidth={2} aria-hidden />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-4 space-y-4 border-t border-[--color-border]">
          <div className="pt-3 space-y-3">
            {/* Title */}
            <div>
              <Label htmlFor={`les-title-${index}`}>Lesson title</Label>
              <input
                id={`les-title-${index}`}
                type="text"
                value={lesson.title}
                onChange={(e) => onChange({ ...lesson, title: e.target.value })}
                className={inputCls}
                placeholder="Lesson title…"
              />
            </div>

            {/* Video URL */}
            <div>
              <Label htmlFor={`les-video-${index}`} optional>Video URL</Label>
              <input
                id={`les-video-${index}`}
                type="url"
                value={lesson.video_url ?? ""}
                onChange={(e) => onChange({ ...lesson, video_url: e.target.value || null })}
                className={inputCls}
                placeholder="https://youtube.com/…"
              />
            </div>

            {/* Content blocks */}
            <div>
              <Label>Content blocks</Label>
              <ContentBlockEditor
                blocks={lesson.content}
                onChange={(content) => onChange({ ...lesson, content })}
              />
            </div>

            {/* Quiz */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Quiz</Label>
                <button
                  type="button"
                  onClick={() => setShowQuiz((s) => !s)}
                  className="text-xs text-[--color-brand] hover:underline"
                >
                  {showQuiz ? "Hide quiz" : "+ Add quiz"}
                </button>
              </div>
              {showQuiz && (
                <QuizEditor
                  questions={lesson.quiz ?? []}
                  onChange={(quiz) => onChange({ ...lesson, quiz })}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Module editor ──────────────────────────────────────────────────────────────

function ModuleEditor({
  mod,
  index,
  onChange,
  onRemove,
}: {
  mod: ModuleFormValues;
  index: number;
  onChange: (m: ModuleFormValues) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  function addLesson() {
    onChange({
      ...mod,
      lessons: [
        ...mod.lessons,
        {
          title: "",
          order_index: mod.lessons.length,
          content: [],
          video_url: null,
          materials: null,
          quiz: [],
        },
      ],
    });
  }

  return (
    <div className="rounded-2xl border border-[--color-border] bg-[--color-surface-2]">
      {/* Module header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[--color-border]">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown size={14} strokeWidth={2} className="shrink-0 text-[--color-fg-muted]" aria-hidden />
          ) : (
            <ChevronRight size={14} strokeWidth={2} className="shrink-0 text-[--color-fg-muted]" aria-hidden />
          )}
          <span className="text-xs font-bold text-[--color-fg-faint] uppercase tracking-widest shrink-0">
            Module {index + 1}
          </span>
          <input
            type="text"
            value={mod.title}
            onChange={(e) => onChange({ ...mod, title: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm font-semibold text-[--color-fg] placeholder-[--color-fg-faint]"
            placeholder="Module title…"
          />
        </button>
        <span className="text-xs text-[--color-fg-faint] shrink-0 tabular-nums">
          {mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-[--color-fg-faint] hover:text-[--color-accent-red] transition-colors"
          aria-label="Remove module"
        >
          <Trash2 size={14} strokeWidth={2} aria-hidden />
        </button>
      </div>

      {expanded && (
        <div className="p-3 space-y-2">
          {mod.lessons.map((les, li) => (
            <LessonEditor
              key={li}
              lesson={les}
              index={li}
              onChange={(updated) => {
                const lessons = [...mod.lessons];
                lessons[li] = updated;
                onChange({ ...mod, lessons });
              }}
              onRemove={() =>
                onChange({
                  ...mod,
                  lessons: mod.lessons
                    .filter((_, idx) => idx !== li)
                    .map((l, idx) => ({ ...l, order_index: idx })),
                })
              }
            />
          ))}
          <button
            type="button"
            onClick={addLesson}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-dashed border-[--color-border] text-xs font-semibold text-[--color-fg-muted] hover:text-[--color-fg] hover:border-[--color-fg]/30 w-full justify-center transition-colors"
          >
            <Plus size={12} strokeWidth={2.5} aria-hidden />
            Add lesson
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main form ──────────────────────────────────────────────────────────────────

export interface CourseFormProps {
  categories: CategoryRow[];
  initial?: CourseWithModules | null;
  editId?: string;
}

export function CourseForm({ categories, initial, editId }: CourseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [values, setValues] = useState<CourseFormValues>(() => {
    if (initial) {
      return {
        title: initial.title,
        slug: initial.slug,
        description: initial.description,
        level: initial.level,
        category_id: initial.category_id ?? null,
        cover_color: initial.cover_color ?? null,
        estimated_minutes: initial.estimated_minutes ?? null,
        tags: initial.tags ?? [],
        status: initial.status,
        modules: initial.modules.map((mod) => ({
          id: mod.id,
          title: mod.title,
          order_index: mod.order_index,
          lessons: mod.lessons.map((les) => ({
            id: les.id,
            title: les.title,
            order_index: les.order_index,
            content: (les.content as ContentBlock[]) ?? [],
            video_url: les.video_url ?? null,
            materials: les.materials ?? null,
            quiz: les.quizzes?.[0]
              ? (les.quizzes[0].questions as QuizQuestion[])
              : [],
          })),
        })),
      };
    }
    return {
      title: "",
      description: "",
      level: "beginner",
      category_id: null,
      cover_color: null,
      estimated_minutes: null,
      tags: [],
      status: "draft",
      modules: [],
    };
  });

  function set<K extends keyof CourseFormValues>(key: K, val: CourseFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function addModule() {
    setValues((prev) => ({
      ...prev,
      modules: [
        ...prev.modules,
        { title: "", order_index: prev.modules.length, lessons: [] },
      ],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!values.description.trim()) {
      toast.error("Description is required");
      return;
    }

    startTransition(async () => {
      const payload: CourseFormValues = {
        ...values,
        modules: values.modules.map((mod, mi) => ({
          ...mod,
          order_index: mi,
          lessons: mod.lessons.map((les, li) => ({
            ...les,
            order_index: li,
          })),
        })),
      };

      if (editId) {
        const result = await updateCourse(editId, payload);
        if (result && "error" in result) {
          toast.error(result.error);
        } else {
          toast.success("Course updated");
          router.push("/admin/courses");
        }
      } else {
        const result = await createCourse(payload);
        if ("error" in result) {
          toast.error(result.error);
        } else {
          toast.success("Course created");
          router.push("/admin/courses");
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">

      <SectionHeading>Metadata</SectionHeading>

      <div>
        <Label htmlFor="c-title">Title</Label>
        <input
          id="c-title"
          type="text"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          className={inputCls}
          placeholder="Course title…"
          required
        />
      </div>

      <div>
        <Label htmlFor="c-desc">Description</Label>
        <textarea
          id="c-desc"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className={inputCls}
          placeholder="Brief overview…"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="c-level">Level</Label>
          <select
            id="c-level"
            value={values.level}
            onChange={(e) => set("level", e.target.value as CourseFormValues["level"])}
            className={selectCls}
          >
            {COURSE_LEVEL_VALUES.map((l) => (
              <option key={l} value={l}>
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="c-status">Status</Label>
          <select
            id="c-status"
            value={values.status}
            onChange={(e) => set("status", e.target.value as CourseFormValues["status"])}
            className={selectCls}
          >
            {CONTENT_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="c-category" optional>Category</Label>
          <select
            id="c-category"
            value={values.category_id ?? ""}
            onChange={(e) => set("category_id", e.target.value || null)}
            className={selectCls}
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="c-minutes" optional>Estimated minutes</Label>
          <input
            id="c-minutes"
            type="number"
            min={1}
            value={values.estimated_minutes ?? ""}
            onChange={(e) =>
              set("estimated_minutes", e.target.value ? parseInt(e.target.value) : null)
            }
            className={inputCls}
            placeholder="e.g. 120"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="c-color" optional>Cover color</Label>
          <input
            id="c-color"
            type="text"
            value={values.cover_color ?? ""}
            onChange={(e) => set("cover_color", e.target.value || null)}
            className={inputCls}
            placeholder="#16A34A"
          />
        </div>
      </div>

      <div>
        <Label optional>Tags</Label>
        <TagsInput value={values.tags} onChange={(tags) => set("tags", tags)} />
      </div>

      <SectionHeading>Modules & Lessons</SectionHeading>

      <div className="space-y-3">
        {values.modules.map((mod, mi) => (
          <ModuleEditor
            key={mi}
            mod={mod}
            index={mi}
            onChange={(updated) => {
              const modules = [...values.modules];
              modules[mi] = updated;
              set("modules", modules);
            }}
            onRemove={() =>
              set(
                "modules",
                values.modules
                  .filter((_, idx) => idx !== mi)
                  .map((m, idx) => ({ ...m, order_index: idx })),
              )
            }
          />
        ))}

        <button
          type="button"
          onClick={addModule}
          className="flex items-center gap-2 h-10 px-4 rounded-xl border border-dashed border-[--color-border] text-sm font-semibold text-[--color-fg-muted] hover:text-[--color-fg] hover:border-[--color-fg]/30 w-full justify-center transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} aria-hidden />
          Add module
        </button>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center h-9 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 active:scale-[0.99] disabled:opacity-60 transition-all duration-200 motion-reduce:transition-none"
        >
          {isPending
            ? editId
              ? "Saving…"
              : "Creating…"
            : editId
            ? "Save changes"
            : "Create course"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/courses")}
          className="inline-flex items-center h-9 px-4 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
