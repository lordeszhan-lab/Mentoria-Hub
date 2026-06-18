import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
import { DashboardClient } from "./dashboard-client";

// ── Server-side aggregates ────────────────────────────────────────────────────

async function getStats() {
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  const now = new Date();
  const ago7d = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const ago30d = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const in7d = new Date(now.getTime() + 7 * 86_400_000).toISOString();

  const [
    { count: totalUsers },
    { count: active7d },
    { count: active30d },
    { count: totalOpportunities },
    { count: publishedOpportunities },
    { count: totalCourses },
    { count: publishedCourses },
    { count: deadlinesIn7d },
    signupsRaw,
    completionsRaw,
    savedRaw,
    enrollmentsRaw,
  ] = await Promise.all([
    // Total users
    db.from("profiles").select("id", { count: "exact", head: true }),

    // Active 7d (has a lesson_progress updated in last 7d)
    db
      .from("lesson_progress")
      .select("user_id", { count: "exact", head: true })
      .gte("updated_at", ago7d),

    // Active 30d
    db
      .from("lesson_progress")
      .select("user_id", { count: "exact", head: true })
      .gte("updated_at", ago30d),

    // Total opportunities
    db.from("opportunities").select("id", { count: "exact", head: true }),

    // Published opportunities
    db
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),

    // Total courses
    db.from("courses").select("id", { count: "exact", head: true }),

    // Published courses
    db
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),

    // Students with a deadline in next 7 days
    db
      .from("deadlines")
      .select("id", { count: "exact", head: true })
      .gte("due_at", now.toISOString())
      .lte("due_at", in7d),

    // Signups over last 30 days (day buckets)
    db
      .from("profiles")
      .select("created_at")
      .gte("created_at", ago30d)
      .order("created_at", { ascending: true }),

    // Completed lessons over last 30 days
    db
      .from("lesson_progress")
      .select("completed_at")
      .eq("status", "completed")
      .gte("completed_at", ago30d)
      .order("completed_at", { ascending: true }),

    // Most saved opportunities
    db
      .from("saved_opportunities")
      .select("opportunity_id"),

    // Enrollments per course (for completion rates)
    db
      .from("enrollments")
      .select("course_id"),
  ]);

  // ── Signups over time — bucket by day ────────────────────────────────────

  const signupBuckets: Record<string, number> = {};
  for (const row of (signupsRaw.data ?? []) as Array<{ created_at: string }>) {
    const day = row.created_at.slice(0, 10);
    signupBuckets[day] = (signupBuckets[day] ?? 0) + 1;
  }

  // Build a 30-day array
  const signupChartData: Array<{ date: string; signups: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    signupChartData.push({
      date: key.slice(5), // MM-DD
      signups: signupBuckets[key] ?? 0,
    });
  }

  // ── Completions over time ─────────────────────────────────────────────────

  const completionBuckets: Record<string, number> = {};
  for (const row of (completionsRaw.data ?? []) as Array<{ completed_at: string | null }>) {
    if (!row.completed_at) continue;
    const day = row.completed_at.slice(0, 10);
    completionBuckets[day] = (completionBuckets[day] ?? 0) + 1;
  }

  const completionChartData: Array<{ date: string; completions: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    completionChartData.push({
      date: key.slice(5),
      completions: completionBuckets[key] ?? 0,
    });
  }

  // ── Most saved opportunities ──────────────────────────────────────────────

  const savedCounts: Record<string, number> = {};
  for (const row of (savedRaw.data ?? []) as Array<{ opportunity_id: string }>) {
    savedCounts[row.opportunity_id] = (savedCounts[row.opportunity_id] ?? 0) + 1;
  }

  const topSavedIds = Object.entries(savedCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ id, count }));

  // Fetch titles for top saved
  const topSaved: Array<{ id: string; title: string; count: number }> = [];
  if (topSavedIds.length > 0) {
    const { data: opps } = await db
      .from("opportunities")
      .select("id, title")
      .in(
        "id",
        topSavedIds.map((r) => r.id),
      ) as { data: Array<{ id: string; title: string }> | null };

    for (const { id, count } of topSavedIds) {
      const opp = opps?.find((o) => o.id === id);
      if (opp) topSaved.push({ id, title: opp.title, count });
    }
  }

  // ── Enrollment counts per course ──────────────────────────────────────────

  const enrollCounts: Record<string, number> = {};
  for (const row of (enrollmentsRaw.data ?? []) as Array<{ course_id: string }>) {
    enrollCounts[row.course_id] = (enrollCounts[row.course_id] ?? 0) + 1;
  }

  return {
    totalUsers: totalUsers ?? 0,
    active7d: active7d ?? 0,
    active30d: active30d ?? 0,
    totalOpportunities: totalOpportunities ?? 0,
    publishedOpportunities: publishedOpportunities ?? 0,
    totalCourses: totalCourses ?? 0,
    publishedCourses: publishedCourses ?? 0,
    deadlinesIn7d: deadlinesIn7d ?? 0,
    signupChartData,
    completionChartData,
    topSaved,
    enrollCounts,
  };
}

export default async function AdminDashboardPage() {
  const [stats, t] = await Promise.all([getStats(), getTranslations("admin")]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground tracking-tight">{t("dashboard")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("platformOverview")}</p>
      </div>

      <DashboardClient stats={stats} />
    </div>
  );
}
