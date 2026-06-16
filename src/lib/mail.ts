import nodemailer, { type Transporter } from "nodemailer";
import { clientEnv } from "@/lib/env";

let transporter: Transporter | null = null;
let initialised = false;

function getTransporter(): Transporter | null {
  if (initialised) return transporter;
  initialised = true;
  const host = process.env.SMTP_HOST;
  if (!host) {
    transporter = null;
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
  });
  return transporter;
}

interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email. If SMTP isn't configured (e.g. local dev), the message is
 * logged to the console instead of failing — so flows still work end-to-end.
 */
export async function sendMail({ to, subject, html, text }: MailInput): Promise<void> {
  const tx = getTransporter();
  const from = process.env.SMTP_FROM || "Trimly <no-reply@trimly.app>";

  if (!tx) {
    console.info(
      `\n📧 [mail:dev] SMTP not configured — would send to ${to}\n   Subject: ${subject}\n   ${text || stripHtml(html)}\n`,
    );
    return;
  }

  await tx.sendMail({ from, to, subject, html, text: text || stripHtml(html) });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// ----- Branded templates ----------------------------------------------------

function layout(title: string, body: string, cta?: { label: string; url: string }) {
  const app = clientEnv.NEXT_PUBLIC_APP_NAME;
  return `
  <div style="background:#0b1020;padding:40px 0;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:28px 32px;">
        <span style="color:#fff;font-size:20px;font-weight:700;">${app}</span>
      </div>
      <div style="padding:32px;color:#0f172a;">
        <h1 style="font-size:20px;margin:0 0 12px;">${title}</h1>
        <div style="font-size:14px;line-height:1.6;color:#334155;">${body}</div>
        ${
          cta
            ? `<a href="${cta.url}" style="display:inline-block;margin-top:24px;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;">${cta.label}</a>
               <p style="font-size:12px;color:#94a3b8;margin-top:20px;word-break:break-all;">Or paste this link: ${cta.url}</p>`
            : ""
        }
      </div>
      <div style="padding:20px 32px;background:#f8fafc;color:#94a3b8;font-size:12px;">
        © ${new Date().getFullYear()} ${app}. If you didn't request this, you can safely ignore it.
      </div>
    </div>
  </div>`;
}

export function sendVerificationEmail(to: string, name: string, url: string) {
  return sendMail({
    to,
    subject: `Verify your ${clientEnv.NEXT_PUBLIC_APP_NAME} email`,
    html: layout(
      `Welcome, ${name}! 👋`,
      `Confirm your email address to secure your account and unlock everything ${clientEnv.NEXT_PUBLIC_APP_NAME} has to offer.`,
      { label: "Verify email", url },
    ),
  });
}

export function sendPasswordResetEmail(to: string, name: string, url: string) {
  return sendMail({
    to,
    subject: `Reset your ${clientEnv.NEXT_PUBLIC_APP_NAME} password`,
    html: layout(
      `Reset your password`,
      `Hi ${name}, we received a request to reset your password. This link expires in 1 hour. If you didn't ask for this, ignore this email.`,
      { label: "Reset password", url },
    ),
  });
}
