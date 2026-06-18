import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export type SupportedLocale = "en" | "ru" | "kk";

const SUPPORTED: SupportedLocale[] = ["en", "ru", "kk"];
const DEFAULT: SupportedLocale = "en";

function isSupported(v: unknown): v is SupportedLocale {
  return typeof v === "string" && (SUPPORTED as string[]).includes(v);
}

export default getRequestConfig(async () => {
  // 1. NEXT_LOCALE cookie (set by the switcher / setLocale action)
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("NEXT_LOCALE")?.value;
  if (isSupported(fromCookie)) {
    return {
      locale: fromCookie,
      messages: (await import(`./messages/${fromCookie}.json`)).default,
    };
  }

  // 2. Logged-in user's profiles.locale
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await (supabase as ReturnType<typeof Object.create>)
        .from("profiles")
        .select("locale")
        .eq("id", user.id)
        .single();

      if (profile && isSupported(profile.locale)) {
        return {
          locale: profile.locale as SupportedLocale,
          messages: (await import(`./messages/${profile.locale}.json`)).default,
        };
      }
    }
  } catch {
    // If DB query fails, fall through to default
  }

  // 3. Default locale
  return {
    locale: DEFAULT,
    messages: (await import(`./messages/${DEFAULT}.json`)).default,
  };
});
