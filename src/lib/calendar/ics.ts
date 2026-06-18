/**
 * Pure ICS / iCalendar helpers.
 *
 * Spec: RFC 5545 — iCalendar
 *
 * Key constraints implemented:
 *   - CRLF (\r\n) line endings
 *   - Line folding at 75 octets (fold continuation starts with single SPACE)
 *   - Text escaping: \, \; \\ \n
 *   - Stable UIDs: deadline-{id}@mentoriahub.io
 *   - Two VALARMs per event: −P14D and −P2D
 *
 * Note on Google Calendar refresh:
 *   Google syncs subscribed calendars roughly once every 12–24 hours.
 *   Urgent deadlines should also be surfaced via in-app notifications
 *   so users don't miss them.
 */

const CRLF = "\r\n";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  /** Stable identifier (maps to deadlines.id in the DB). */
  id: string;
  /** Human-readable deadline title. */
  title: string;
  /**
   * ISO 8601 datetime when the deadline is due.
   * UTC is assumed when no timezone offset is present.
   */
  dueAt: string;
  /** Optional link back to the app (shown in description). */
  url?: string;
}

// ── Text escaping (RFC 5545 §3.3.11) ─────────────────────────────────────────

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")      // backslash first
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");   // literal newlines → \n
}

// ── Date / time formatting ────────────────────────────────────────────────────

/** Convert an ISO string to ICS DATETIME in UTC (YYYYMMDDTHHMMSSZ). */
function toUtcDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.getUTCFullYear().toString() +
    String(d.getUTCMonth() + 1).padStart(2, "0") +
    String(d.getUTCDate()).padStart(2, "0") +
    "T" +
    String(d.getUTCHours()).padStart(2, "0") +
    String(d.getUTCMinutes()).padStart(2, "0") +
    String(d.getUTCSeconds()).padStart(2, "0") +
    "Z"
  );
}

/** Return the ISO string for `base` + `days` days. */
function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86_400_000).toISOString();
}

// ── Line folding (RFC 5545 §3.1) ─────────────────────────────────────────────

/**
 * Fold a single content line at 75 octets.
 * Continuation lines begin with a single SPACE character.
 */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let remaining = line;
  while (remaining.length > 75) {
    parts.push(remaining.slice(0, 75));
    remaining = " " + remaining.slice(75);
  }
  parts.push(remaining);
  return parts.join(CRLF);
}

/** Build a single property line (folded) terminated with CRLF. */
function prop(name: string, value: string): string {
  return fold(`${name}:${value}`) + CRLF;
}

// ── VEVENT ────────────────────────────────────────────────────────────────────

export function buildVEvent(event: CalendarEvent): string {
  const dtStart = toUtcDateTime(event.dueAt);
  // DTEND = deadline day + 1 (all-day boundary for the calendar display)
  const dtEnd = toUtcDateTime(addDays(event.dueAt, 1));
  const dtstamp = toUtcDateTime(new Date().toISOString());
  const uid = `deadline-${event.id}@mentoriahub.io`;
  const description = event.url
    ? `Deadline from Mentoria Hub. Open: ${event.url}`
    : "Deadline from Mentoria Hub.";

  return (
    prop("BEGIN", "VEVENT") +
    prop("UID", uid) +
    prop("DTSTAMP", dtstamp) +
    prop("DTSTART", dtStart) +
    prop("DTEND", dtEnd) +
    prop("SUMMARY", escapeText(event.title)) +
    prop("DESCRIPTION", escapeText(description)) +
    // VALARM: 14 days before
    prop("BEGIN", "VALARM") +
    prop("ACTION", "DISPLAY") +
    prop("DESCRIPTION", escapeText("Deadline reminder: 14 days left")) +
    prop("TRIGGER", "-P14D") +
    prop("END", "VALARM") +
    // VALARM: 2 days before
    prop("BEGIN", "VALARM") +
    prop("ACTION", "DISPLAY") +
    prop("DESCRIPTION", escapeText("Deadline reminder: 2 days left")) +
    prop("TRIGGER", "-P2D") +
    prop("END", "VALARM") +
    prop("END", "VEVENT")
  );
}

// ── VCALENDAR ─────────────────────────────────────────────────────────────────

export function buildVCalendar(events: CalendarEvent[]): string {
  return (
    prop("BEGIN", "VCALENDAR") +
    prop("VERSION", "2.0") +
    prop("PRODID", "-//Mentoria Hub//Deadlines//EN") +
    prop("CALSCALE", "GREGORIAN") +
    prop("METHOD", "PUBLISH") +
    prop("X-WR-CALNAME", "Mentoria Hub Deadlines") +
    prop("X-WR-TIMEZONE", "UTC") +
    // Hint to clients to refresh hourly (Google still caps at ~12–24h for feeds).
    prop("X-PUBLISHED-TTL", "PT1H") +
    events.map(buildVEvent).join("") +
    prop("END", "VCALENDAR")
  );
}

// ── Single-event ICS download ─────────────────────────────────────────────────

/** Build a minimal VCALENDAR containing a single event for download. */
export function buildSingleEventIcs(event: CalendarEvent): string {
  return buildVCalendar([event]);
}

// ── Google Calendar URL ───────────────────────────────────────────────────────

/**
 * Build a Google Calendar "add event" URL for a single deadline.
 * Fills title, dates, and optional description.
 */
export function googleCalendarUrl(event: CalendarEvent): string {
  const dtStart = toUtcDateTime(event.dueAt);
  const dtEnd = toUtcDateTime(addDays(event.dueAt, 1));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${dtStart}/${dtEnd}`,
    details: event.url
      ? `Deadline from Mentoria Hub. Open: ${event.url}`
      : "Deadline from Mentoria Hub.",
    sf: "true",
    output: "xml",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
