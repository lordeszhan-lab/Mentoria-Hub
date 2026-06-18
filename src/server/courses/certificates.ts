"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { awardXp } from "@/server/gamification/actions";
import { getCourseProgress } from "@/server/courses/actions";
import { XP_COURSE_COMPLETED } from "@/lib/constants";
import type { CertificateRow } from "@/lib/supabase/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IssueCertificateResult {
  certificate?: CertificateRow;
  error?: string;
  /** true when course is not yet 100% complete */
  notComplete?: boolean;
}

export interface GetCertificatesResult {
  certificates: CertificateRow[];
  error?: string;
}

// ── issueCertificate ──────────────────────────────────────────────────────────

/**
 * Issue a certificate for the current user + course if the course is 100%
 * complete (all lessons done). Idempotent — returns the existing certificate
 * if one was already issued.
 *
 * Uses the service-role admin client so it can write regardless of RLS.
 * The caller must be authenticated (we verify via the SSR client).
 */
export async function issueCertificate(
  courseId: string,
): Promise<IssueCertificateResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check 100% completion
  const { progressPct } = await getCourseProgress(user.id, courseId);
  if (progressPct < 100) {
    return { notComplete: true };
  }

  // Check for existing certificate (idempotent)
  const { data: existing } = (await db
    .from("certificates")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .single()) as { data: CertificateRow | null };

  if (existing) return { certificate: existing };

  // Fetch snapshot data: student name + course title
  const { data: profile } = (await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()) as { data: { full_name: string | null } | null };

  const { data: course } = (await admin
    .from("courses")
    .select("title")
    .eq("id", courseId)
    .single()) as { data: { title: string } | null };

  if (!course) return { error: "Course not found" };

  const studentName = profile?.full_name?.trim() || "Student";
  const courseTitle = course.title;
  const completionDate = new Date().toISOString().split("T")[0];

  // Insert certificate — rely on the unique constraint (user_id, course_id) to
  // handle any rare concurrent duplicates gracefully.
  const { data: cert, error: insertErr } = (await admin
    .from("certificates")
    .insert({
      user_id: user.id,
      course_id: courseId,
      serial: `MENT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      student_name: studentName,
      course_title: courseTitle,
      completion_date: completionDate,
    })
    .select("*")
    .single()) as { data: CertificateRow | null; error: { message: string } | null };

  if (insertErr) {
    // Duplicate key — another concurrent request beat us; fetch the existing one
    if (insertErr.message.includes("duplicate")) {
      const { data: race } = (await admin
        .from("certificates")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .single()) as { data: CertificateRow | null };
      if (race) return { certificate: race };
    }
    return { error: insertErr.message };
  }

  if (!cert) return { error: "Failed to create certificate" };

  // Award course-completion XP (fire-and-forget)
  awardXp(user.id, XP_COURSE_COMPLETED, `course_complete:${courseId}`).catch(() => {});

  return { certificate: cert };
}

// ── getCertificates ───────────────────────────────────────────────────────────

/**
 * Return all certificates for the current authenticated user, newest first.
 */
export async function getCertificates(): Promise<GetCertificatesResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { certificates: [], error: "Not authenticated" };

  const { data, error } = (await db
    .from("certificates")
    .select("*")
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false })) as {
    data: CertificateRow[] | null;
    error: { message: string } | null;
  };

  if (error) return { certificates: [], error: error.message };
  return { certificates: data ?? [] };
}

// ── getCertificateByShareToken ────────────────────────────────────────────────

/**
 * Fetch a certificate by its public share_token — no auth required.
 * Uses the admin client to bypass RLS (the public SELECT policy covers anon
 * reads, but using admin ensures it works even in edge cases).
 */
export async function getCertificateByShareToken(
  shareToken: string,
): Promise<CertificateRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data } = (await admin
    .from("certificates")
    .select("*")
    .eq("share_token", shareToken)
    .single()) as { data: CertificateRow | null };

  return data;
}
