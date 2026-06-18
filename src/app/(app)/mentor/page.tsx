import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MentorChat } from "./mentor-chat";
import type { MentorMessageRow } from "@/lib/supabase/types";

/**
 * AI Mentor page — loads initial messages + student name, then hands off to
 * the interactive client chat component.
 */
export default async function MentorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [messagesResult, profileResult] = await Promise.all([
    db
      .from("mentor_messages")
      .select("id,role,content,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50) as Promise<{ data: MentorMessageRow[] | null }>,
    db
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single() as Promise<{ data: { full_name: string | null } | null }>,
  ]);

  return (
    <MentorChat
      initialMessages={messagesResult.data ?? []}
      userName={profileResult.data?.full_name ?? null}
    />
  );
}
