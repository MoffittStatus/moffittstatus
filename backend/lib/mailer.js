const nodemailer = require('nodemailer');

const env = (key) => (process.env[key] || '').trim();

let transporter = null;

// Returns null when SMTP isn't configured
function getTransporter() {
  if (transporter) return transporter;
  if (!env('SMTP_HOST') || !env('SMTP_USER') || !env('SMTP_PASS')) return null;

  const port = Number(env('SMTP_PORT')) || 587;
  transporter = nodemailer.createTransport({
    host: env('SMTP_HOST'),
    port,
    secure: port === 465,
    auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') },
  });
  return transporter;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

async function sendMail({ to, subject, text, html }) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[mailer] SMTP not configured, would send to ${to}: ${subject}\n${text}`);
    return;
  }
  await transport.sendMail({
    from: env('SMTP_FROM') || env('SMTP_USER'),
    to,
    subject,
    text,
    html,
  });
}

async function sendGroupInviteEmail({ to, groupName, inviterName, role, link }) {
  const roleLabel = role === 'ADMIN' ? 'an admin' : 'a member';
  const subject = `You're invited to join ${groupName} on Moffitt Status`;
  const text =
    `${inviterName} invited you to join ${groupName} as ${roleLabel}.\n\n` +
    `Accept or decline here: ${link}\n\n` +
    `This invite expires in 7 days.`;
  const html =
    `<p>${escapeHtml(inviterName)} invited you to join <strong>${escapeHtml(groupName)}</strong> as ${roleLabel}.</p>` +
    `<p><a href="${escapeHtml(link)}">Accept or decline the invite</a></p>` +
    `<p>This invite expires in 7 days.</p>`;

  await sendMail({ to, subject, text, html });
}

module.exports = { sendMail, sendGroupInviteEmail };
