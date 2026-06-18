import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Email OTP / magic-link token verification handler.
 * Supabase sends the user here with `token_hash` and `type` query params
 * when they click a magic-link in their email.
 *
 * The `type` is typically "magiclink" or "signup".
 * On success, redirects to /dashboard (or the `next` param).
 * On failure (expired / already used), redirects to login with error.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }

    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(error.message)}`,
        origin,
      ),
    );
  }

  return NextResponse.redirect(
    new URL("/auth/login?error=invalid_confirmation_link", origin),
  );
}
