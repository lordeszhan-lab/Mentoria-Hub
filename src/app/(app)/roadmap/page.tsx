import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadRoadmapForUser } from "@/server/roadmap/actions";
import { RoadmapClient } from "./roadmap-client";

/**
 * Roadmap page — server component.
 * Fetches the user's existing roadmap (if any) and passes it to the
 * interactive client component. The client handles generation, status
 * updates, and the full timeline UI.
 */
export default async function RoadmapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Attempt to load existing roadmap — graceful if none exists yet
  const result = await loadRoadmapForUser(user.id);
  const initial = "data" in result ? result.data : null;

  return <RoadmapClient initial={initial} />;
}
