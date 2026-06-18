import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ── POST /api/push/subscribe — save a new push subscription ──────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { endpoint?: string; keys?: { p256dh: string; auth: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { endpoint, keys } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Missing endpoint or keys" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  // Upsert: update keys if endpoint already registered, otherwise insert
  const { data: existing } = (await db
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("endpoint", endpoint)
    .maybeSingle()) as { data: { id: string } | null };

  if (existing) {
    await db
      .from("push_subscriptions")
      .update({ keys, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await db.from("push_subscriptions").insert({
      user_id: user.id,
      endpoint,
      keys,
    });
  }

  return NextResponse.json({ success: true });
}

// ── DELETE /api/push/subscribe — remove a push subscription ──────────────────

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let endpoint: string | undefined;
  try {
    const body = (await req.json()) as { endpoint?: string };
    endpoint = body.endpoint;
  } catch {
    // Body is optional for DELETE
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  let query = db
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id);

  if (endpoint) {
    query = query.eq("endpoint", endpoint);
  }

  await query;

  return NextResponse.json({ success: true });
}
