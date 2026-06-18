import "server-only";

import { webpush } from "@/lib/push/webpush";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PushSubscriptionRow } from "@/lib/supabase/types";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

/**
 * Send a push notification to all subscriptions for a user.
 *
 * Dead endpoints (HTTP 404 / 410) are pruned from the database
 * so they don't accumulate.
 *
 * This function never throws — push is supplemental and must not
 * break the primary flow.
 */
export async function sendPush(userId: string, payload: PushPayload): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const { data: subs } = (await db
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId)) as { data: PushSubscriptionRow[] | null };

  if (!subs?.length) return;

  for (const sub of subs) {
    try {
      const keys = sub.keys as { p256dh: string; auth: string };
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url ?? "/dashboard",
          icon: payload.icon ?? "/mentoria-logo.png",
        }),
      );
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        // Endpoint is no longer valid — prune it
        await db.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }
}
