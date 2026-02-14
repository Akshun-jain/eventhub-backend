"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.isEmailConfigured = isEmailConfigured;
exports.buildReminderEmailHTML = buildReminderEmailHTML;
const nodemailer_1 = __importDefault(require("nodemailer"));
const environment_1 = require("../../../config/environment");
const logger_1 = __importDefault(require("../../../shared/utils/logger"));
// Lazy-initialized transporter
let transporter = null;
function getTransporter() {
    if (!environment_1.env.SMTP_HOST || !environment_1.env.SMTP_USER) {
        return null;
    }
    if (!transporter) {
        transporter = nodemailer_1.default.createTransport({
            host: environment_1.env.SMTP_HOST,
            port: environment_1.env.SMTP_PORT,
            secure: environment_1.env.SMTP_PORT === 465,
            auth: {
                user: environment_1.env.SMTP_USER,
                pass: environment_1.env.SMTP_PASSWORD,
            },
        });
    }
    return transporter;
}
async function sendEmail(payload) {
    try {
        // Development mode — log only
        if (environment_1.env.NODE_ENV === 'development' || !environment_1.env.SMTP_HOST) {
            logger_1.default.info(`[DEV EMAIL] 📧 To: ${payload.to} | Subject: "${payload.subject}"`);
            return { success: true, message_id: `dev-email-${Date.now()}` };
        }
        // Production: SMTP
        const mailer = getTransporter();
        if (!mailer) {
            return { success: false, error: 'Email not configured' };
        }
        const info = await mailer.sendMail({
            from: environment_1.env.SMTP_FROM,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text || payload.html.replace(/<[^>]*>/g, ''),
        });
        logger_1.default.info(`Email sent to ${payload.to}, ID: ${info.messageId}`);
        return { success: true, message_id: info.messageId };
    }
    catch (error) {
        logger_1.default.error(`Email to ${payload.to} failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}
function isEmailConfigured() {
    return !!(environment_1.env.SMTP_HOST && environment_1.env.SMTP_USER);
}
// ── Build HTML for reminder emails ──
function buildReminderEmailHTML(data) {
    const emoji = data.event_type === 'birthday' ? '🎂' :
        data.event_type === 'anniversary' ? '💍' :
            data.event_type === 'meeting' ? '📅' :
                data.event_type === 'deadline' ? '⏰' : '🎉';
    const whenText = data.days_until === 0 ? 'is <strong>today</strong>' :
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
//# sourceMappingURL=email.channel.js.map