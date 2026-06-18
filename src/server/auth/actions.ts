"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Send a magic-link to the given email address.
 *
 * Production note: Supabase's built-in SMTP is rate-limited (~4 emails/hour).
 * Configure a custom SMTP provider (Resend recommended) in the Supabase
 * dashboard: Authentication → SMTP Settings. Set RESEND_API_KEY + EMAIL_FROM
 * in your .env and in the Supabase project env as well.
 *
 * One-time link expiry: 1 hour by default (configurable in Supabase Auth settings).
 * The redirect URL *must* be in your Supabase allowlist:
 *   Authentication → URL Configuration → Redirect URLs
 *   Add: http://localhost:3000/auth/callback (dev) and your production URL.
 */
export async function signInWithMagicLink(
  _: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = formData.get("email");

  if (!email || typeof email !== "string") {
    return { error: "A valid email address is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

/**
 * Initiate Google OAuth sign-in.
 * Must configure Google provider in Supabase: Authentication → Providers → Google.
 * Add authorised redirect URI to Google Cloud Console:
 *   https://<project-ref>.supabase.co/auth/v1/callback
 */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appUrl}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) {
    redirect(`/auth/login?error=${encodeURIComponent(error?.message ?? "OAuth failed")}`);
  }

  redirect(data.url);
}

/**
 * Sign the current user out and redirect to the login screen.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
