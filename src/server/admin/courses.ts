"use server";

import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CourseFormValues } from "@/lib/zod/admin";
import type { CourseRow, ModuleRow, LessonRow, QuizRow } from "@/lib/supabase/types";

// ── Auth guard ──────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null };

  if (profile?.role !== "admin") redirect("/dashboard");
}

// ── Slug helper ─────────────────────────────────────────────────────────────

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 120);
}

// ── Create ──────────────────────────────────────────────────────────────────

export async function createCourse(
  values: CourseFormValues,
): Promise<{ id: string; slug: string } | { error: string }> {
  await requireAdmin();
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  const slug = values.slug || toSlug(values.title);

  const { data: course, error: courseErr } = await db
    .from("courses")
    .insert({
      title: values.title,
      slug,
      description: values.description,
      level: values.level,
      category_id: values.category_id ?? null,
      cover_color: values.cover_color ?? null,
      estimated_minutes: values.estimated_minutes ?? null,
      tags: values.tags,
      status: values.status,
    })
    .select("id, slug")
    .single();

  if (courseErr) return { error: (courseErr as { message: string }).message };
  const courseId = (course as { id: string; slug: string }).id;
  const courseSlug = (course as { id: string; slug: string }).slug;

  // Insert modules + lessons
  for (const mod of values.modules) {
    const { data: modRow, error: modErr } = await db
      .from("modules")
      .insert({
        course_id: courseId,
        title: mod.title,
        order_index: mod.order_index,
      })
      .select("id")
      .single();

    if (modErr) continue;
    const modId = (modRow as { id: string }).id;

    for (const les of mod.lessons) {
      const { data: lesRow, error: lesErr } = await db
        .from("lessons")
        .insert({
          module_id: modId,
          title: les.title,
          order_index: les.order_index,
          content: les.content,
          video_url: les.video_url || null,
          materials: les.materials ?? null,
        })
        .select("id")
        .single();

      if (lesErr) continue;
      const lesId = (lesRow as { id: string }).id;

      if (les.quiz && les.quiz.length > 0) {
        await db.from("quizzes").insert({
          lesson_id: lesId,
          questions: les.quiz,
        });
      }
    }
  }

  return { id: courseId, slug: courseSlug };
}

// ── Update ──────────────────────────────────────────────────────────────────

export async function updateCourse(
  courseId: string,
  values: CourseFormValues,
): Promise<void | { error: string }> {
  await requireAdmin();
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  const slug = values.slug || toSlug(values.title);

  const { error: courseErr } = await db
    .from("courses")
    .update({
      title: values.title,
      slug,
      description: values.description,
      level: values.level,
      category_id: values.category_id ?? null,
      cover_color: values.cover_color ?? null,
      estimated_minutes: values.estimated_minutes ?? null,
      tags: values.tags,
      status: values.status,
    })
    .eq("id", courseId);

  if (courseErr) return { error: (courseErr as { message: string }).message };

  // Delete existing modules (cascade deletes lessons + quizzes)
  await db.from("modules").delete().eq("course_id", courseId);

  // Re-insert modules + lessons
  for (const mod of values.modules) {
    const { data: modRow, error: modErr } = await db
      .from("modules")
      .insert({
        course_id: courseId,
        title: mod.title,
        order_index: mod.order_index,
      })
      .select("id")
      .single();

    if (modErr) continue;
    const modId = (modRow as { id: string }).id;

    for (const les of mod.lessons) {
      const { data: lesRow, error: lesErr } = await db
        .from("lessons")
        .insert({
          module_id: modId,
          title: les.title,
          order_index: les.order_index,
          content: les.content,
          video_url: les.video_url || null,
          materials: les.materials ?? null,
        })
        .select("id")
        .single();

      if (lesErr) continue;
      const lesId = (lesRow as { id: string }).id;

      if (les.quiz && les.quiz.length > 0) {
        await db.from("quizzes").insert({
          lesson_id: lesId,
          questions: les.quiz,
        });
      }
    }
  }
}

// ── Archive / Delete ────────────────────────────────────────────────────────

export async function archiveCourse(
  id: string,
): Promise<void | { error: string }> {
  await requireAdmin();
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const { error } = await db
    .from("courses")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) return { error: (error as { message: string }).message };
}

export async function deleteCourse(
  id: string,
): Promise<void | { error: string }> {
  await requireAdmin();
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const { error } = await db.from("courses").delete().eq("id", id);
  if (error) return { error: (error as { message: string }).message };
}

// ── Read helpers ─────────────────────────────────────────────────────────────

export interface CourseWithModules extends CourseRow {
  modules: Array<
    ModuleRow & {
      lessons: Array<LessonRow & { quizzes: QuizRow[] }>;
    }
  >;
}

export async function getCourseWithModules(
  id: string,
): Promise<CourseWithModules | null> {
  await requireAdmin();
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  const { data: course } = await db
    .from("courses")
    .select("*")
    .eq("id", id)
    .single() as { data: CourseRow | null };

  if (!course) return null;

  const { data: modules } = await db
    .from("modules")
    .select("*")
    .eq("course_id", id)
    .order("order_index") as { data: ModuleRow[] | null };

  const result: CourseWithModules = {
    ...course,
    modules: [],
  };

  for (const mod of modules ?? []) {
    const { data: lessons } = await db
      .from("lessons")
      .select("*")
      .eq("module_id", mod.id)
      .order("order_index") as { data: LessonRow[] | null };

    const lessonsWithQuiz = [];
    for (const les of lessons ?? []) {
      const { data: quizzes } = await db
        .from("quizzes")
        .select("*")
        .eq("lesson_id", les.id) as { data: QuizRow[] | null };
      lessonsWithQuiz.push({ ...les, quizzes: quizzes ?? [] });
    }
    result.modules.push({ ...mod, lessons: lessonsWithQuiz });
  }

  return result;
}

export async function listCourses(opts?: {
  q?: string;
  status?: string;
  page?: number;
}): Promise<{ rows: CourseRow[]; count: number }> {
  await requireAdmin();
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const PAGE_SIZE = 30;
  const page = opts?.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = db.from("courses").select("*", { count: "exact" });
  if (opts?.q) {
    q = q.ilike("title", `%${opts.q}%`);
  }
  if (opts?.status) q = q.eq("status", opts.status);
  q = q.order("created_at", { ascending: false }).range(from, to);

  const { data, count, error } = await q;
  if (error) throw new Error((error as { message: string }).message);
  return { rows: (data ?? []) as CourseRow[], count: count ?? 0 };
}
