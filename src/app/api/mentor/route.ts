import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import OpenAI from "openai";
import type {
  ProfileRow,
  RoadmapRow,
  RoadmapStepRow,
  CourseRow,
  EnrollmentRow,
  LessonProgressRow,
  ModuleRow,
  LessonRow,
  SavedOpportunityRow,
  OpportunityRow,
  DeadlineRow,
  MentorMessageRow,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const maxDuration = 55; // seconds — Vercel hobby limit is 60 s

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Request body ──────────────────────────────────────────────────────────────

interface MentorRequest {
  message: string;
}

// ── Context types ─────────────────────────────────────────────────────────────

interface StepSummary {
  title: string;
  status: string;
  kind: string;
  deadline: string | null;
  linkedTitle: string | null;
}

interface CourseSummary {
  title: string;
  completedLessons: number;
  totalLessons: number;
  progressPct: number;
}

interface OppSummary {
  title: string;
  deadline: string | null;
}

interface ContextBundle {
  profile: Pick<
    ProfileRow,
    | "full_name"
    | "grade"
    | "locale"
    | "goal"
    | "target_majors"
    | "interests"
    | "subjects"
    | "city"
    | "country"
    | "xp"
  > | null;
  steps: StepSummary[];
  nextStep: StepSummary | null;
  courses: CourseSummary[];
  savedOpps: OppSummary[];
  deadlines: Pick<DeadlineRow, "title" | "due_at">[];
}

// ── Context bundle assembler ──────────────────────────────────────────────────

async function assembleContext(userId: string): Promise<ContextBundle> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const [
    profileResult,
    roadmapResult,
    enrollmentsResult,
    savedResult,
    deadlinesResult,
  ] = await Promise.all([
    db
      .from("profiles")
      .select(
        "full_name,grade,locale,goal,target_majors,interests,subjects,city,country,xp",
      )
      .eq("id", userId)
      .single() as Promise<{
      data: Pick<
        ProfileRow,
        | "full_name"
        | "grade"
        | "locale"
        | "goal"
        | "target_majors"
        | "interests"
        | "subjects"
        | "city"
        | "country"
        | "xp"
      > | null;
    }>,

    db
      .from("roadmaps")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as Promise<{ data: Pick<RoadmapRow, "id"> | null }>,

    db
      .from("enrollments")
      .select("course_id")
      .eq("user_id", userId) as Promise<{
      data: Pick<EnrollmentRow, "course_id">[] | null;
    }>,

    db
      .from("saved_opportunities")
      .select("opportunity_id")
      .eq("user_id", userId)
      .limit(10) as Promise<{
      data: Pick<SavedOpportunityRow, "opportunity_id">[] | null;
    }>,

    db
      .from("deadlines")
      .select("title,due_at")
      .eq("user_id", userId)
      .gte("due_at", new Date().toISOString())
      .order("due_at", { ascending: true })
      .limit(5) as Promise<{
      data: Pick<DeadlineRow, "title" | "due_at">[] | null;
    }>,
  ]);

  const profile = profileResult.data ?? null;
  const roadmapId = roadmapResult.data?.id ?? null;
  const enrolledIds = (enrollmentsResult.data ?? []).map((e) => e.course_id);
  const savedOppIds = (savedResult.data ?? []).map((s) => s.opportunity_id);
  const deadlines = deadlinesResult.data ?? [];

  // ── Roadmap steps ──────────────────────────────────────────────────────────

  let steps: StepSummary[] = [];
  let nextStep: StepSummary | null = null;

  if (roadmapId) {
    const { data: rawSteps } = (await db
      .from("roadmap_steps")
      .select(
        "title,status,kind,deadline,opportunity_id,course_id,order_index,grade",
      )
      .eq("roadmap_id", roadmapId)
      .order("grade", { ascending: true })
      .order("order_index", { ascending: true })
      .limit(30)) as {
      data: Pick<
        RoadmapStepRow,
        | "title"
        | "status"
        | "kind"
        | "deadline"
        | "opportunity_id"
        | "course_id"
        | "order_index"
        | "grade"
      >[] | null;
    };

    const stepRows = rawSteps ?? [];

    // Fetch linked opportunity/course titles
    const oppIds = stepRows
      .map((s) => s.opportunity_id)
      .filter(Boolean) as string[];
    const crsIds = stepRows
      .map((s) => s.course_id)
      .filter(Boolean) as string[];

    const [oppTitles, crsTitles] = await Promise.all([
      oppIds.length > 0
        ? (db
            .from("opportunities")
            .select("id,title")
            .in("id", oppIds) as Promise<{
            data: Pick<OpportunityRow, "id" | "title">[] | null;
          }>)
        : Promise.resolve({ data: [] as Pick<OpportunityRow, "id" | "title">[] }),
      crsIds.length > 0
        ? (db
            .from("courses")
            .select("id,title")
            .in("id", crsIds) as Promise<{
            data: Pick<CourseRow, "id" | "title">[] | null;
          }>)
        : Promise.resolve({ data: [] as Pick<CourseRow, "id" | "title">[] }),
    ]);

    const oppTitleMap = new Map(
      (oppTitles.data ?? []).map((o) => [o.id, o.title]),
    );
    const crsTitleMap = new Map(
      (crsTitles.data ?? []).map((c) => [c.id, c.title]),
    );

    steps = stepRows.map((s) => ({
      title: s.title,
      status: s.status,
      kind: s.kind,
      deadline: s.deadline,
      linkedTitle:
        s.opportunity_id
          ? (oppTitleMap.get(s.opportunity_id) ?? null)
          : s.course_id
            ? (crsTitleMap.get(s.course_id) ?? null)
            : null,
    }));

    nextStep =
      steps.find((s) => s.status === "in_progress") ??
      steps.find((s) => s.status === "available") ??
      null;
  }

  // ── Enrolled courses with progress ────────────────────────────────────────

  let courses: CourseSummary[] = [];

  if (enrolledIds.length > 0) {
    const [courseRows, moduleRows] = await Promise.all([
      db
        .from("courses")
        .select("id,title")
        .in("id", enrolledIds) as Promise<{
        data: Pick<CourseRow, "id" | "title">[] | null;
      }>,
      db
        .from("modules")
        .select("id,course_id")
        .in("course_id", enrolledIds) as Promise<{
        data: Pick<ModuleRow, "id" | "course_id">[] | null;
      }>,
    ]);

    const moduleIds = (moduleRows.data ?? []).map((m) => m.id);

    const [lessonRows, progressRows] = await Promise.all([
      moduleIds.length > 0
        ? (db
            .from("lessons")
            .select("id,module_id")
            .in("module_id", moduleIds) as Promise<{
            data: Pick<LessonRow, "id" | "module_id">[] | null;
          }>)
        : Promise.resolve({ data: [] as Pick<LessonRow, "id" | "module_id">[] }),
      moduleIds.length > 0
        ? (db
            .from("lesson_progress")
            .select("lesson_id,status")
            .eq("user_id", userId) as Promise<{
            data: Pick<LessonProgressRow, "lesson_id" | "status">[] | null;
          }>)
        : Promise.resolve({
            data: [] as Pick<LessonProgressRow, "lesson_id" | "status">[],
          }),
    ]);

    const moduleToCourse = new Map(
      (moduleRows.data ?? []).map((m) => [m.id, m.course_id]),
    );
    const completedSet = new Set(
      (progressRows.data ?? [])
        .filter((p) => p.status === "completed")
        .map((p) => p.lesson_id),
    );

    // Group lessons by course
    const lessonsByCourse = new Map<string, string[]>();
    for (const l of lessonRows.data ?? []) {
      const courseId = moduleToCourse.get(l.module_id);
      if (!courseId) continue;
      const list = lessonsByCourse.get(courseId) ?? [];
      list.push(l.id);
      lessonsByCourse.set(courseId, list);
    }

    courses = (courseRows.data ?? []).map((c) => {
      const lessonIds = lessonsByCourse.get(c.id) ?? [];
      const total = lessonIds.length;
      const completed = lessonIds.filter((id) => completedSet.has(id)).length;
      return {
        title: c.title,
        completedLessons: completed,
        totalLessons: total,
        progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }

  // ── Saved opportunities ────────────────────────────────────────────────────

  let savedOpps: OppSummary[] = [];

  if (savedOppIds.length > 0) {
    const { data: oppRows } = (await db
      .from("opportunities")
      .select("title,deadline")
      .in("id", savedOppIds)
      .eq("status", "published")) as {
      data: Pick<OpportunityRow, "title" | "deadline">[] | null;
    };
    savedOpps = (oppRows ?? []).map((o) => ({
      title: o.title,
      deadline: o.deadline,
    }));
  }

  return { profile, steps, nextStep, courses, savedOpps, deadlines };
}

// ── System prompt builder ─────────────────────────────────────────────────────

function buildSystemPrompt(ctx: ContextBundle): string {
  const { profile, steps, nextStep, courses, savedOpps, deadlines } = ctx;

  const locale = profile?.locale ?? "en";
  const localeLabel =
    locale === "ru" ? "Russian" : locale === "kk" ? "Kazakh" : "English";
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Format a date string relative to today
  function fmtDeadline(iso: string | null): string {
    if (!iso) return "no deadline";
    const d = new Date(iso);
    const daysLeft = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
    const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    if (daysLeft < 0) return `${label} (past)`;
    if (daysLeft === 0) return `${label} (today!)`;
    if (daysLeft === 1) return `${label} (tomorrow)`;
    return `${label} (in ${daysLeft} days)`;
  }

  const stepsDone = steps.filter((s) => s.status === "done").length;
  const stepsTotal = steps.length;

  let roadmapSection = "No roadmap generated yet.";
  if (steps.length > 0) {
    const lines = steps.map((s) => {
      const linked = s.linkedTitle ? ` [${s.linkedTitle}]` : "";
      const dl = s.deadline ? ` — deadline ${fmtDeadline(s.deadline)}` : "";
      return `  • [${s.status.toUpperCase()}] ${s.title}${linked}${dl} (${s.kind})`;
    });
    roadmapSection = lines.join("\n");
  }

  let nextStepSection = "No next step identified.";
  if (nextStep) {
    const linked = nextStep.linkedTitle ? ` "${nextStep.linkedTitle}"` : "";
    const dl = nextStep.deadline
      ? ` (deadline: ${fmtDeadline(nextStep.deadline)})`
      : "";
    nextStepSection = `${nextStep.title}${linked}${dl} — kind: ${nextStep.kind}, status: ${nextStep.status}`;
  }

  let coursesSection = "No courses enrolled.";
  if (courses.length > 0) {
    coursesSection = courses
      .map(
        (c) =>
          `  • "${c.title}" — ${c.completedLessons}/${c.totalLessons} lessons done (${c.progressPct}%)`,
      )
      .join("\n");
  }

  let savedOppsSection = "None saved.";
  if (savedOpps.length > 0) {
    savedOppsSection = savedOpps
      .map((o) => `  • "${o.title}" — deadline ${fmtDeadline(o.deadline)}`)
      .join("\n");
  }

  let deadlinesSection = "No upcoming deadlines.";
  if (deadlines.length > 0) {
    deadlinesSection = deadlines
      .map((d) => `  • "${d.title}" — ${fmtDeadline(d.due_at)}`)
      .join("\n");
  }

  return `You are a warm, knowledgeable, and encouraging academic mentor inside Mentoria Hub — a university preparation platform for students in grades 8–11.

TODAY: ${today}

LANGUAGE RULE: Respond in ${localeLabel} (locale: ${locale}). If the student's latest message is clearly written in a different language, match that language. For Kazakh, use correct modern orthography; for Russian, use warm, grammatically correct Russian.

STUDENT PROFILE:
- Name: ${profile?.full_name ?? "Student"}
- Grade: ${profile?.grade ?? "unknown"}
- City/Country: ${profile?.city ?? "–"}, ${profile?.country ?? "–"}
- Goal: ${profile?.goal ?? "Not specified"}
- Target majors: ${profile?.target_majors?.join(", ") || "Not specified"}
- Interests: ${profile?.interests?.join(", ") || "Not specified"}
- Subjects: ${profile?.subjects?.join(", ") || "Not specified"}
- XP earned: ${profile?.xp ?? 0}

ROADMAP PROGRESS: ${stepsDone}/${stepsTotal} steps done
${roadmapSection}

NEXT RECOMMENDED ACTION:
${nextStepSection}

COURSES IN PROGRESS:
${coursesSection}

SAVED OPPORTUNITIES:
${savedOppsSection}

UPCOMING DEADLINES:
${deadlinesSection}

MENTOR INSTRUCTIONS:
1. Ground every response in the student's REAL data above. Reference their actual roadmap steps, courses, opportunities, and deadlines by name. Never invent opportunities or courses that are not listed.
2. Give concrete, actionable advice: "Your next step is X — here's how to start…", "You have Y days until the Z deadline…".
3. Keep answers concise (3–6 sentences for simple questions; up to 2 short paragraphs for complex ones). No walls of text.
4. Be encouraging, realistic, and specific. Celebrate progress (steps done, XP earned) while pointing to what's next.
5. If the student asks about something outside their data (e.g. a course or opportunity not in their profile), say you can only see their current plan and encourage them to explore the opportunities section.
6. NEVER expose raw JSON, IDs, or technical database field names in your replies.`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: MentorRequest;
  try {
    body = (await req.json()) as MentorRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  // ── Load history + context in parallel ────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userDb = supabase as any;

  const [historyResult, context] = await Promise.all([
    userDb
      .from("mentor_messages")
      .select("role,content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20) as Promise<{
      data: Pick<MentorMessageRow, "role" | "content">[] | null;
    }>,
    assembleContext(user.id),
  ]);

  // Reverse so oldest first (we fetched DESC)
  const history = (historyResult.data ?? []).reverse();

  // ── Save user message ─────────────────────────────────────────────────────
  await userDb.from("mentor_messages").insert({
    user_id: user.id,
    role: "user",
    content: message,
  });

  // ── Build OpenAI messages ─────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(context);

  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  // ── Stream ────────────────────────────────────────────────────────────────
  let fullReply = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: openaiMessages,
          max_tokens: 800,
          temperature: 0.7,
          stream: true,
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            fullReply += delta;
            controller.enqueue(new TextEncoder().encode(delta));
          }
        }
      } catch (err) {
        console.error("[mentor] OpenAI stream error", err);
        const errMsg =
          "\n\n[I couldn't respond just now — please try again in a moment.]";
        controller.enqueue(new TextEncoder().encode(errMsg));
        fullReply += errMsg;
      } finally {
        controller.close();
        // Persist assistant reply (fire-and-forget, response already delivered)
        if (fullReply.trim()) {
          userDb
            .from("mentor_messages")
            .insert({
              user_id: user.id,
              role: "assistant",
              content: fullReply.trim(),
            })
            .then(() => {/* persisted */})
            .catch((e: unknown) => {
              console.error("[mentor] Failed to persist assistant message", e);
            });
        }
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
