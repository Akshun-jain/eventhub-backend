import nodemailer from 'nodemailer';
import { env } from '../../../config/environment';
import logger from '../../../shared/utils/logger';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

// Lazy-initialized transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }

  return transporter;
}

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  try {
    // Development mode — log only
    if (env.NODE_ENV === 'development' || !env.SMTP_HOST) {
      logger.info(
        `[DEV EMAIL] 📧 To: ${payload.to} | Subject: "${payload.subject}"`
      );
      return { success: true, message_id: `dev-email-${Date.now()}` };
    }

    // Production: SMTP
    const mailer = getTransporter();

    if (!mailer) {
      return { success: false, error: 'Email not configured' };
    }

    const info = await mailer.sendMail({
      from: env.SMTP_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text || payload.html.replace(/<[^>]*>/g, ''),
    });

    logger.info(`Email sent to ${payload.to}, ID: ${info.messageId}`);
    return { success: true, message_id: info.messageId };
  } catch (error: any) {
    logger.error(`Email to ${payload.to} failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export function isEmailConfigured(): boolean {
  return !!(env.SMTP_HOST && env.SMTP_USER);
}

// ── Build HTML for reminder emails ──
export function buildReminderEmailHTML(data: {
  event_title: string;
  person_name: string;
  event_type: string;
  event_date: string;
  group_name: string;
  days_until: number;
  notes?: string;
}): string {
  const emoji =
    data.event_type === 'birthday' ? '🎂' :
    data.event_type === 'anniversary' ? '💍' :
    data.event_type === 'meeting' ? '📅' :
    data.event_type === 'deadline' ? '⏰' : '🎉';

  const whenText =
    data.days_until === 0 ? 'is <strong>today</strong>' :
    data.days_until === 1 ? 'is <strong>tomorrow</strong>' :
    `is in <strong>${data.days_until} days</strong>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;">${emoji} Event Reminder</h1>
    </div>
    <div style="padding:28px 32px;">
      <div style="background:#f9fafb;border-radius:10px;padding:20px;border-left:4px solid #6366F1;margin-bottom:20px;">
        <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">${data.event_title}</h2>
        <p style="margin:4px 0;color:#6b7280;font-size:14px;">👤 ${data.person_name}</p>
        <p style="margin:4px 0;color:#6b7280;font-size:14px;">📅 ${data.event_date}</p>
        <p style="margin:4px 0;color:#6b7280;font-size:14px;">👥 ${data.group_name}</p>
        ${data.notes ? `<p style="margin:8px 0 0;color:#6b7280;font-size:13px;">📝 ${data.notes}</p>` : ''}
      </div>
      <p style="color:#374151;font-size:15px;line-height:1.5;">
        This event ${whenText}. Don't forget to mark the occasion!
      </p>
    </div>
    <div style="padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">Sent by EventHub — Your Event Reminder Platform</p>
    </div>
  </div>
</body>
</html>`.trim();
}