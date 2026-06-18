import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWeeklyLeaderboard } from "@/server/leaderboard/actions";
import { LeaderboardClient } from "./leaderboard-client";

/**
 * /leaderboard — weekly XP ranking page.
 *
 * Server component: fetches auth + leaderboard data, passes to the animated
 * client component. The leaderboard is secondary to track-progress — it sits
 * behind a nav link and a small dashboard card, never front-and-centre.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Weekly Leaderboard — Mentoria Hub",
  description: "See who's been learning the most this week.",
};

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const data = await getWeeklyLeaderboard(user.id, 20);

  return <LeaderboardClient data={data} currentUserId={user.id} />;
}
