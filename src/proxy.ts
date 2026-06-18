/**
 * proxy.ts — Auth + routing guard (Next.js 16 equivalent of middleware.ts).
 *
 * Responsibilities:
 *  1. Refresh the Supabase session on every request (writes updated auth cookies
 *     to the response so the session never silently expires).
 *  2. Protect (app) routes — redirect unauthenticated users to /auth/login.
 *  3. If authenticated but onboarding not complete, redirect (app) routes
 *     (except /onboarding itself) to /onboarding.
 *  4. Protect (admin) routes — require role='admin', else redirect to /dashboard.
 *  5. (public) routes are always open.
 *
 * Security note: This file performs *optimistic* checks from the Supabase
 * JWT stored in cookies. It should NOT make database queries — those belong
 * in Server Components / Route Handlers via the Data Access Layer. The proxy
 * refresh call updates the cookie when the JWT is close to expiry.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

// ─── Route classification ──────────────────────────────────────────────────────

/** Prefixes that require an authenticated session. */
const APP_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/profile",
  "/opportunities",
  "/courses",
  "/roadmap",
  "/leaderboard",
  "/mentor",
] as const;

/** Prefixes that require role='admin'. */
const ADMIN_PREFIXES = ["/admin"] as const;

function isAppRoute(pathname: string): boolean {
  return APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

// ─── Proxy ───────────────────────────────────────────────────────────────────

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write to both the request (for downstream Server Components)
          // and to the response (so the browser gets the refreshed token).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() also refreshes the session cookie if the JWT is close to expiry.
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // ── Admin routes ──────────────────────────────────────────────────────────
  if (isAdminRoute(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Fetch the user's role from their profile.
    // Kept minimal: a single eq filter — fast enough for proxy use.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as unknown as { data: { role: string } | null };

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  }

  // ── App routes ────────────────────────────────────────────────────────────
  if (isAppRoute(pathname)) {
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check onboarding status — skip the /onboarding route itself to avoid loop.
    if (!pathname.startsWith("/onboarding")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single() as unknown as { data: { onboarding_completed: boolean } | null };

      if (profile && !profile.onboarding_completed) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }

    return response;
  }

  // ── Public routes — always pass through ──────────────────────────────────
  return response;
}

export const config = {
  matcher: [
    /*
     * Match every request path except:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$).*)",
  ],
};
