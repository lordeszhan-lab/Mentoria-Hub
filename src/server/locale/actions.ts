"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SupportedLocale = "en" | "ru" | "kk";

const SUPPORTED: SupportedLocale[] = ["en", "ru", "kk"];

function isSupported(v: unknown): v is SupportedLocale {
  return typeof v === "string" && (SUPPORTED as string[]).includes(v);
}

/**
 * Sets the active locale.
 * 1. Validates locale ∈ {en, ru, kk}.
 * 2. Sets the NEXT_LOCALE cookie so the UI re-renders immediately (no DB round-trip).
 * 3. If a user is logged in, also persists to profiles.locale.
 * 4. Revalidates all paths so Server Components re-run with the new locale.
 */
export async function setLocale(locale: string): Promise<void> {
  if (!isSupported(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  // Set the cookie (1 year, HTTP-only is not needed here — client needs to read it)
  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // Persist to DB if logged in
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await (supabase as ReturnType<typeof Object.create>)
        .from("profiles")
        .update({ locale })
        .eq("id", user.id);
    }
  } catch {
    // Non-fatal — cookie is the primary source of truth
  }

  revalidatePath("/", "layout");
}
