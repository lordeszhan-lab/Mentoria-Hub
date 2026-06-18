/**
 * Route Handler: GET /api/calendar/:token
 *
 * Returns a VCALENDAR (text/calendar) of the user's upcoming deadlines,
 * authenticated by `profiles.calendar_token` (service-role lookup).
 *
 * Intended for subscription via webcal:// or https:// feed URLs so that
 * Google Calendar, Apple Calendar, etc. can auto-refresh the user's deadlines.
 *
 * Note on refresh cadence:
 *   Google Calendar refreshes subscribed feeds at most once every 12–24 hours.
 *   Apple Calendar follows the X-PUBLISHED-TTL hint (set to PT1H) but may
 *   still cap refresh to every few hours. Urgent deadlines are also surfaced
 *   via in-app email reminders so users are not solely reliant on calendar sync.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDeadlinesByCalendarToken } from "@/server/deadlines/get";
import { buildVCalendar } from "@/lib/calendar/ics";
import type { DeadlineRow } from "@/lib/supabase/types";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://mentoriahub.io";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params;

  if (!token) {
    return new NextResponse("Not found", { status: 404 });
  }

  const result = await getDeadlinesByCalendarToken(token);

  if (!result) {
    return new NextResponse("Not found", { status: 404 });
  }

  const events = result.deadlines.map((d: DeadlineRow) => ({
    id: d.id,
    title: d.title,
    dueAt: d.due_at,
    url: `${APP_URL}/dashboard`,
  }));

  const icsBody = buildVCalendar(events);

  return new NextResponse(icsBody, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mentoria-deadlines.ics"',
      // Do not cache — each request should reflect the freshest deadlines.
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
