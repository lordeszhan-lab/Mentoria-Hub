import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { InstallBanner } from "@/components/pwa/install-banner";

/**
 * Auth guard + app shell layout for the (app) route group.
 *
 * Fetches the minimum profile data needed for the sidebar (name, xp, streak)
 * and wraps every authenticated page in the AppShell (sidebar + mobile nav).
 *
 * Unauthenticated visitors are redirected to login.
 * cookies() makes this layout dynamic (no static cache) — intentional, as
 * the XP/streak badge in the sidebar should always reflect the freshest state.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("full_name, xp, streak_count")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as {
    full_name: string | null;
    xp: number;
    streak_count: number;
  } | null;

  return (
    <>
      <AppShell
        userName={typedProfile?.full_name ?? null}
        xp={typedProfile?.xp ?? 0}
        streakCount={typedProfile?.streak_count ?? 0}
      >
        {children}
      </AppShell>
      <InstallBanner />
    </>
  );
}
