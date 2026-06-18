import "server-only";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://mentoriahub.com";

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Mentoria Hub</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:system-ui,-apple-system,sans-serif;color:#111827;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
      <tr>
        <td style="background:#1CB0F6;padding:20px 32px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">Mentoria Hub</span>
        </td>
      </tr>
      <tr><td style="padding:32px;">${content}</td></tr>
      <tr>
        <td style="padding:16px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;">
            You are receiving this because you are registered on Mentoria Hub.
            <a href="${APP_URL}/profile" style="color:#6B7280;">Manage notification preferences</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ── Deadline reminder ─────────────────────────────────────────────────────────

export interface DeadlineReminderParams {
  userName: string;
  deadlineTitle: string;
  daysUntil: number;
  dueAt: string;
}

export function deadlineReminderHtml(p: DeadlineReminderParams): string {
  const urgent = p.daysUntil <= 2;
  const accentColor = urgent ? "#DC2626" : "#1D4ED8";
  const label = urgent ? "Urgent reminder" : "Upcoming deadline";

  return base(`
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${accentColor};text-transform:uppercase;letter-spacing:0.05em;">${label}</p>
    <h2 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;">Hi ${p.userName},</h2>
    <p style="margin:0 0 16px;font-size:16px;color:#374151;">
      Your deadline <strong style="color:#111827;">${p.deadlineTitle}</strong> is approaching in
      <strong style="color:${accentColor};">${p.daysUntil} day${p.daysUntil === 1 ? "" : "s"}</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="background:#F3F4F6;border-radius:8px;padding:0;margin:0 0 24px;width:100%;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#111827;">${p.deadlineTitle}</p>
          <p style="margin:0;font-size:14px;color:#6B7280;">Due: ${formatDate(p.dueAt)}</p>
        </td>
      </tr>
    </table>
    <a href="${APP_URL}/dashboard"
       style="display:inline-block;background:#1CB0F6;color:#ffffff;text-decoration:none;
              padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px;">
      View dashboard
    </a>
  `);
}

// ── Weekly digest ─────────────────────────────────────────────────────────────

export interface WeeklyDigestParams {
  userName: string;
  deadlines: Array<{ title: string; due_at: string }>;
}

export function weeklyDigestHtml(p: WeeklyDigestParams): string {
  const deadlineRows =
    p.deadlines.length > 0
      ? p.deadlines
          .map(
            (d) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
                <span style="font-size:14px;font-weight:600;color:#111827;">${d.title}</span><br/>
                <span style="font-size:13px;color:#6B7280;">${formatDate(d.due_at)}</span>
              </td>
            </tr>`,
          )
          .join("")
      : `<tr><td style="padding:10px 0;font-size:14px;color:#9CA3AF;">No upcoming deadlines this week.</td></tr>`;

  return base(`
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1CB0F6;text-transform:uppercase;letter-spacing:0.05em;">Weekly digest</p>
    <h2 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;">Good week, ${p.userName}!</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#374151;">Here is your Mentoria Hub summary for this week.</p>

    <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827;">Upcoming deadlines</h3>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 28px;">
      ${deadlineRows}
    </table>

    <a href="${APP_URL}/dashboard"
       style="display:inline-block;background:#1CB0F6;color:#ffffff;text-decoration:none;
              padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px;">
      Open Mentoria Hub
    </a>
  `);
}
