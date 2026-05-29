const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const getBrevoConfig = () => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderName = process.env.BREVO_SENDER_NAME || "Skill Swap";
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL;

  if (!apiKey || !senderEmail) {
    console.warn("⚠️ Brevo env vars missing — emails will NOT be sent.");
    return null;
  }

  return {
    apiKey,
    senderName,
    senderEmail,
    receiverEmail: receiverEmail || senderEmail,
  };
};

const sendBrevoEmail = async ({ to, subject, htmlContent, replyTo }) => {
  const config = getBrevoConfig();
  if (!config) return;

  const payload = {
    sender: {
      name: config.senderName,
      email: config.senderEmail,
    },
    to: [
      {
        email: to,
      },
    ],
    subject,
    htmlContent,
  };

  if (replyTo?.email) {
    payload.replyTo = {
      email: replyTo.email,
      name: replyTo.name || replyTo.email,
    };
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": config.apiKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message || `Brevo email failed with status ${response.status}`
    );
  }

  return data;
};

// ── Shared HTML wrapper ─────────────────────────────────────
const wrapHtml = (body) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Skill Swap</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:28px 32px;">
              <h1 style="margin:0;font-size:22px;color:#ffffff;font-weight:700;letter-spacing:-0.3px;">⚡ Skill Swap</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #f0f0f0;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                &copy; ${new Date().getFullYear()} Skill Swap &mdash; Learn, Teach, Grow Together
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ── 1. Contact / Feedback email → site owner ────────────────
export const sendContactEmail = async ({ name, email, message }) => {
  const config = getBrevoConfig();
  if (!config) return;

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);

  const html = wrapHtml(`
    <h2 style="margin:0 0 6px;font-size:20px;color:#111827;">📬 New Feedback Received</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
      Someone submitted the contact form on your website.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;border-radius:10px;border:1px solid #f3f4f6;">
          <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
            From
          </p>
          <p style="margin:0;font-size:15px;color:#111827;font-weight:600;">
            ${safeName}
          </p>
          <p style="margin:4px 0 0;font-size:14px;color:#2563eb;">
            ${safeEmail}
          </p>
        </td>
      </tr>
    </table>

    <div style="padding:16px;background:#f0f4ff;border-radius:10px;border-left:4px solid #2563eb;">
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;">
        MESSAGE
      </p>
      <p style="margin:0;font-size:15px;color:#1f2937;line-height:1.6;white-space:pre-wrap;">
        ${safeMessage}
      </p>
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
      You can reply directly to <strong>${safeEmail}</strong> to respond.
    </p>
  `);

  try {
    await sendBrevoEmail({
      to: config.receiverEmail,
      subject: `New Feedback from ${name} — Skill Swap`,
      htmlContent: html,
      replyTo: {
        email,
        name,
      },
    });

    console.log(`✅ Contact email sent via Brevo to ${config.receiverEmail}`);
  } catch (error) {
    console.error("❌ Failed to send contact email via Brevo:", error.message);
  }
};

// ── 2. Session notification email → user ────────────────────
export const sendSessionNotificationEmail = async ({
  recipientEmail,
  recipientName,
  proposerName,
  skill,
  scheduledFor,
  mode,
  durationMinutes,
}) => {
  const dateStr = new Date(scheduledFor).toLocaleString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  const modeLabel =
    {
      chat: "💬 Chat",
      video: "📹 Video Call",
      audio: "🎧 Audio Call",
      in_person: "🤝 In Person",
    }[mode] || "💬 Chat";

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const safeRecipientName = escapeHtml(recipientName || "there");
  const safeProposerName = escapeHtml(proposerName);
  const safeSkill = escapeHtml(skill || "General");
  const safeDateStr = escapeHtml(dateStr);
  const safeDurationMinutes = escapeHtml(durationMinutes);
  const safeModeLabel = escapeHtml(modeLabel);

  const html = wrapHtml(`
    <h2 style="margin:0 0 6px;font-size:20px;color:#111827;">🗓️ New Session Proposal</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
      Hey <strong>${safeRecipientName}</strong>, you have a new session proposal!
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:16px;background:#f9fafb;border-radius:12px;border:1px solid #f3f4f6;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;">
                <span style="font-size:13px;color:#9ca3af;font-weight:600;">PROPOSED BY</span><br/>
                <span style="font-size:15px;color:#111827;font-weight:600;">${safeProposerName}</span>
              </td>
            </tr>

            <tr>
              <td style="padding:6px 0;">
                <span style="font-size:13px;color:#9ca3af;font-weight:600;">SKILL</span><br/>
                <span style="font-size:15px;color:#2563eb;font-weight:600;">${safeSkill}</span>
              </td>
            </tr>

            <tr>
              <td style="padding:6px 0;">
                <span style="font-size:13px;color:#9ca3af;font-weight:600;">SCHEDULED FOR</span><br/>
                <span style="font-size:15px;color:#111827;">${safeDateStr}</span>
              </td>
            </tr>

            <tr>
              <td style="padding:6px 0;">
                <span style="font-size:13px;color:#9ca3af;font-weight:600;">DURATION</span><br/>
                <span style="font-size:15px;color:#111827;">${safeDurationMinutes} minutes</span>
              </td>
            </tr>

            <tr>
              <td style="padding:6px 0;">
                <span style="font-size:13px;color:#9ca3af;font-weight:600;">MODE</span><br/>
                <span style="font-size:15px;color:#111827;">${safeModeLabel}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${frontendUrl}/sessions"
             style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
            View &amp; Respond
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
      Log in to Skill Swap to accept, reject, or reschedule this session.
    </p>
  `);

  try {
    await sendBrevoEmail({
      to: recipientEmail,
      subject: `${proposerName} proposed a session — Skill Swap`,
      htmlContent: html,
    });

    console.log(`✅ Session notification email sent via Brevo to ${recipientEmail}`);
  } catch (error) {
    console.error(
      "❌ Failed to send session notification email via Brevo:",
      error.message
    );
  }
};