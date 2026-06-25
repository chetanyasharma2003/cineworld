import nodemailer from "nodemailer";
import logger from "./logger.js";

const FROM = process.env.SMTP_FROM || `"CineWorld" <noreply@cineworld.app>`;

// Cache Ethereal test account so we don't create a new one on every email
let _etherealTransport = null;

async function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  // Dev: use Ethereal — real test SMTP, gives a preview URL you can open in the browser
  if (!_etherealTransport) {
    const testAccount = await nodemailer.createTestAccount();
    _etherealTransport = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    logger.info(`[DEV] Ethereal test account: ${testAccount.user}`);
    logger.info(`[DEV] View sent emails at: https://ethereal.email`);
  }
  return _etherealTransport;
}

export async function sendPasswordResetEmail(to, name, resetUrl) {
  const transporter = await createTransport();
  const info = await transporter.sendMail({
    from: FROM,
    to,
    subject: "Reset your CineWorld password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:16px;">
        <h1 style="color:#e50914;font-size:24px;margin-bottom:8px;">CineWorld</h1>
        <p style="color:#d1d5db;">Hi ${name},</p>
        <p style="color:#d1d5db;">We received a request to reset your password. Click the button below within 30 minutes:</p>
        <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#e50914;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;">Reset Password</a>
        <p style="color:#6b7280;font-size:12px;">If you didn't request this, ignore this email. Your password won't change.</p>
      </div>
    `,
  });

  if (!process.env.SMTP_HOST) {
    logger.info(`[DEV] Password reset email → ${to}`);
    logger.info(`[DEV] Reset URL: ${resetUrl}`);
    logger.info(`[DEV] Preview: ${nodemailer.getTestMessageUrl(info)}`);
  }
}

export async function sendVerificationEmail(to, name, verifyUrl) {
  const transporter = await createTransport();
  const info = await transporter.sendMail({
    from: FROM,
    to,
    subject: "Verify your CineWorld email",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:16px;">
        <h1 style="color:#e50914;font-size:24px;margin-bottom:8px;">CineWorld</h1>
        <p style="color:#d1d5db;">Hi ${name},</p>
        <p style="color:#d1d5db;">Welcome! Please verify your email address by clicking the button below within 24 hours:</p>
        <a href="${verifyUrl}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#e50914;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;">Verify Email</a>
        <p style="color:#6b7280;font-size:12px;">If you didn't create a CineWorld account, ignore this email.</p>
      </div>
    `,
  });

  if (!process.env.SMTP_HOST) {
    logger.info(`[DEV] Verification email → ${to}`);
    logger.info(`[DEV] Verify URL: ${verifyUrl}`);
    logger.info(`[DEV] Preview: ${nodemailer.getTestMessageUrl(info)}`);
  }
}

export async function sendWeeklyDigestEmail(to, name, picks) {
  const transporter = await createTransport();

  const picksHtml = picks.map((p, i) => `
    <div style="margin-bottom:16px;padding:16px;background:#111;border-radius:12px;border-left:3px solid #e50914;">
      <p style="color:#e50914;font-size:11px;font-weight:700;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Pick #${i + 1}</p>
      <p style="color:#fff;font-size:16px;font-weight:800;margin:0 0 4px;">${p.title} <span style="color:#6b7280;font-size:14px;font-weight:400">(${p.year})</span></p>
      <p style="color:#9ca3af;font-size:13px;margin:0;">${p.reason}</p>
    </div>
  `).join("");

  const info = await transporter.sendMail({
    from: FROM,
    to,
    subject: `🎬 Your CineWorld weekly picks are here, ${name}!`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:16px;">
        <h1 style="color:#e50914;font-size:24px;margin-bottom:4px;">CineWorld</h1>
        <p style="color:#6b7280;font-size:12px;margin-bottom:24px;text-transform:uppercase;letter-spacing:1px;">Weekly Digest</p>
        <p style="color:#d1d5db;font-size:15px;margin-bottom:8px;">Hey ${name},</p>
        <p style="color:#d1d5db;font-size:15px;margin-bottom:24px;">Your AI-curated picks for this week — chosen just for you based on your watchlist taste:</p>
        ${picksHtml}
        <a href="${process.env.CLIENT_ORIGIN || "http://localhost:5173"}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#e50914;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
          Open CineWorld →
        </a>
        <p style="color:#374151;font-size:11px;margin-top:24px;">You're receiving this because you have a CineWorld account. Visit your profile to manage preferences.</p>
      </div>
    `,
  });

  if (!process.env.SMTP_HOST) {
    logger.info(`[DEV] Weekly digest → ${to}`);
    logger.info(`[DEV] Preview: ${nodemailer.getTestMessageUrl(info)}`);
  }
}
