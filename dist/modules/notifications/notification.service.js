"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../../database/models");
const push_channel_1 = require("./channels/push.channel");
const sms_channel_1 = require("./channels/sms.channel");
const whatsapp_channel_1 = require("./channels/whatsapp.channel");
const email_channel_1 = require("./channels/email.channel");
const errorHandler_1 = require("../../shared/middleware/errorHandler");
const logger_1 = __importDefault(require("../../shared/utils/logger"));
const models_2 = require("../../database/models");
function getEventEmoji(eventType) {
    switch (eventType) {
        case 'birthday': return '🎂';
        case 'anniversary': return '💍';
        case 'meeting': return '📅';
        case 'deadline': return '⏰';
        default: return '🎉';
    }
}
function buildReminderTitle(target) {
    const emoji = getEventEmoji(target.event_type);
    if (target.days_until === 0) {
        return `${emoji} Today: ${target.event_title}`;
    }
    if (target.days_until === 1) {
        return `${emoji} Tomorrow: ${target.event_title}`;
    }
    return `${emoji} In ${target.days_until} days: ${target.event_title}`;
}
function buildReminderBody(target) {
    const when = target.days_until === 0 ? 'is today' :
        target.days_until === 1 ? 'is tomorrow' :
            `is in ${target.days_until} days`;
    if (target.event_type === 'birthday') {
        return `${target.person_name}'s birthday ${when}! Don't forget to wish them! 🎉`;
    }
    if (target.event_type === 'anniversary') {
        return `${target.person_name}'s anniversary ${when}! Time to celebrate! 💐`;
    }
    if (target.event_type === 'meeting') {
        return `Meeting "${target.event_title}" ${when}. Be prepared! 📋`;
    }
    if (target.event_type === 'deadline') {
        return `Deadline "${target.event_title}" ${when}. Wrap up! ⚡`;
    }
    return `${target.event_title} — ${target.person_name} ${when}!`;
}
class NotificationService {
    async registerDevice(userId, input) {
        const existing = await models_2.DeviceToken.findOne({
            where: { token: input.token },
        });
        if (existing) {
            if (existing.user_id === userId) {
                await existing.update({
                    is_active: true,
                    platform: input.platform,
                    device_name: input.device_name || existing.device_name,
                    last_used_at: new Date(),
                });
                return existing.toJSON();
            }
            await existing.update({
                user_id: userId,
                is_active: true,
                platform: input.platform,
                device_name: input.device_name || null,
                last_used_at: new Date(),
            });
            return existing.toJSON();
        }
        const deviceToken = await models_2.DeviceToken.create({
            user_id: userId,
            token: input.token,
            platform: input.platform,
            device_name: input.device_name || null,
        });
        return deviceToken.toJSON();
    }
    async removeDevice(userId, token) {
        const deviceToken = await models_2.DeviceToken.findOne({
            where: { user_id: userId, token },
        });
        if (!deviceToken) {
            throw new errorHandler_1.AppError('Device token not found', 404);
        }
        await deviceToken.update({ is_active: false });
    }
    async getUserDevices(userId) {
        const devices = await models_2.DeviceToken.findAll({
            where: { user_id: userId, is_active: true },
            order: [['last_used_at', 'DESC']],
        });
        return devices.map((d) => ({
            id: d.id,
            platform: d.platform,
            device_name: d.device_name,
            last_used_at: d.last_used_at,
            created_at: d.created_at,
        }));
    }
    // ══════════════════════════════════════
    // MARK SINGLE NOTIFICATION AS READ
    // ══════════════════════════════════════
    async markAsRead(notificationId, userId) {
        const notification = await models_1.Notification.findOne({
            where: { id: notificationId, user_id: userId },
        });
        if (!notification) {
            throw new errorHandler_1.AppError('Notification not found', 404);
        }
        // already read → return directly
        if (notification.read_at) {
            return notification.toJSON();
        }
        await notification.update({ read_at: new Date() });
        return notification.toJSON();
    }
    // ══════════════════════════════════════
    // MARK ALL AS READ
    // ══════════════════════════════════════
    async markAllAsRead(userId) {
        const [count] = await models_1.Notification.update({ read_at: new Date() }, {
            where: {
                user_id: userId,
                read_at: null,
            },
        });
        return count;
    }
    // ══════════════════════════════════════
    // READ / UNREAD COUNT
    // ══════════════════════════════════════
    async getUnreadCount(userId) {
        const total = await models_1.Notification.count({
            where: {
                user_id: userId,
                read_at: null,
                status: { [sequelize_1.Op.in]: ['sent', 'delivered'] },
            },
        });
        const channelCounts = await models_1.Notification.findAll({
            where: {
                user_id: userId,
                read_at: null,
                status: { [sequelize_1.Op.in]: ['sent', 'delivered'] },
            },
            attributes: [
                'channel',
                [models_1.Notification.sequelize.fn('COUNT', models_1.Notification.sequelize.col('id')), 'count'],
            ],
            group: ['channel'],
            raw: true,
        });
        const byChannel = {
            push: 0,
            sms: 0,
            whatsapp: 0,
            email: 0,
        };
        for (const row of channelCounts) {
            byChannel[row.channel] = parseInt(row.count, 10);
        }
        return { total, by_channel: byChannel };
    }
    // ══════════════════════════════════════════
    // DISPATCH reminders to all enabled channels
    // Called by ReminderService for each target
    // ══════════════════════════════════════════
    async dispatchReminder(target) {
        const title = buildReminderTitle(target);
        const body = buildReminderBody(target);
        const results = [];
        // ── Push ──
        if (target.notify_push) {
            const result = await this.sendAndLog(target, 'push', title, body, async () => {
                return (0, push_channel_1.sendPushToUser)(target.user_id, title, body, {
                    event_id: target.event_id,
                    group_id: target.group_id,
                    event_type: target.event_type,
                });
            });
            results.push(result);
        }
        // ── SMS ──
        if (target.notify_sms && target.user_phone) {
            const result = await this.sendAndLog(target, 'sms', title, body, async () => {
                return (0, sms_channel_1.sendSMS)({
                    to: target.user_phone,
                    body: `${title}\n${body}`,
                });
            });
            results.push(result);
        }
        // ── WhatsApp ──
        if (target.notify_whatsapp && target.user_phone) {
            const result = await this.sendAndLog(target, 'whatsapp', title, body, async () => {
                return (0, whatsapp_channel_1.sendWhatsApp)({
                    to: target.user_phone,
                    body: `${title}\n\n${body}`,
                });
            });
            results.push(result);
        }
        // ── Email ──
        if (target.notify_email && target.user_email) {
            const html = (0, email_channel_1.buildReminderEmailHTML)({
                event_title: target.event_title,
                person_name: target.person_name,
                event_type: target.event_type,
                event_date: target.next_occurrence,
                group_name: target.group_name,
                days_until: target.days_until,
                notes: target.notes,
            });
            const result = await this.sendAndLog(target, 'email', title, body, async () => {
                return (0, email_channel_1.sendEmail)({
                    to: target.user_email,
                    subject: title,
                    html,
                    text: body,
                });
            });
            results.push(result);
        }
        return results;
    }
    // ══════════════════════════════════════════
    // Send via channel and log to DB
    // ══════════════════════════════════════════
    async sendAndLog(target, channel, title, body, sendFn) {
        try {
            const result = await sendFn();
            const success = result.success;
            // Log to database
            await models_1.Notification.create({
                user_id: target.user_id,
                event_id: target.event_id,
                group_id: target.group_id,
                channel,
                title,
                body,
                status: success ? 'sent' : 'failed',
                scheduled_at: new Date(),
                sent_at: success ? new Date() : null,
                fail_reason: result.error || null,
                metadata: {
                    message_id: result.message_id || result.sid || null,
                    reminder_type: target.reminder_type,
                    days_until: target.days_until,
                },
            });
            return {
                channel,
                success,
                message_id: result.message_id || result.sid,
                error: result.error,
            };
        }
        catch (error) {
            // Log failure to DB
            await models_1.Notification.create({
                user_id: target.user_id,
                event_id: target.event_id,
                group_id: target.group_id,
                channel,
                title,
                body,
                status: 'failed',
                scheduled_at: new Date(),
                fail_reason: error.message,
                metadata: {
                    reminder_type: target.reminder_type,
                    days_until: target.days_until,
                },
            }).catch((dbErr) => {
                logger_1.default.error('Failed to log notification to DB:', dbErr);
            });
            return {
                channel,
                success: false,
                error: error.message,
            };
        }
    }
    // ══════════════════════════════════════════
    // RETRY failed notifications
    // ══════════════════════════════════════════
    async retryFailedNotifications() {
        const failed = await models_1.Notification.findAll({
            where: {
                status: 'failed',
                retry_count: { [sequelize_1.Op.lt]: 3 },
                created_at: { [sequelize_1.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
            include: [
                { model: models_1.User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
                { model: models_1.Event, as: 'event', attributes: ['id', 'title', 'person_name', 'event_type'] },
                { model: models_1.Group, as: 'group', attributes: ['id', 'name'] },
            ],
            limit: 50,
        });
        if (failed.length === 0) {
            return 0;
        }
        logger_1.default.info(`Retrying ${failed.length} failed notifications`);
        let retried = 0;
        for (const notif of failed) {
            const raw = notif.toJSON();
            let result = { success: false };
            try {
                switch (notif.channel) {
                    case 'push': {
                        const pushResult = await (0, push_channel_1.sendPushToUser)(notif.user_id, notif.title, notif.body, {
                            event_id: notif.event_id,
                            group_id: notif.group_id,
                        });
                        // If no device tokens → treat as failure so retry logic works
                        if ((pushResult.tokens_sent || 0) === 0) {
                            result = { success: false, error: 'No active device tokens' };
                        }
                        else {
                            result = pushResult;
                        }
                        break;
                    }
                    case 'sms':
                        if (raw.user?.phone) {
                            result = await (0, sms_channel_1.sendSMS)({ to: raw.user.phone, body: notif.body });
                        }
                        break;
                    case 'whatsapp':
                        if (raw.user?.phone) {
                            result = await (0, whatsapp_channel_1.sendWhatsApp)({ to: raw.user.phone, body: notif.body });
                        }
                        break;
                    case 'email':
                        if (raw.user?.email) {
                            result = await (0, email_channel_1.sendEmail)({
                                to: raw.user.email,
                                subject: notif.title,
                                html: `<p>${notif.body}</p>`,
                            });
                        }
                        break;
                }
                await notif.update({
                    status: result.success ? 'sent' : 'failed',
                    sent_at: result.success ? new Date() : null,
                    retry_count: notif.retry_count + 1,
                    fail_reason: result.error || null,
                });
                if (result.success)
                    retried++;
            }
            catch (error) {
                await notif.update({
                    retry_count: notif.retry_count + 1,
                    fail_reason: error.message,
                });
            }
        }
        logger_1.default.info(`Retry complete: ${retried}/${failed.length} succeeded`);
        return retried;
    }
    // ══════════════════════════════════════════
    // GET user's notification history
    // ══════════════════════════════════════════
    async getUserNotifications(userId, options) {
        const page = options.page || 1;
        const limit = options.limit || 20;
        const offset = (page - 1) * limit;
        const where = { user_id: userId };
        if (options.channel)
            where.channel = options.channel;
        if (options.status)
            where.status = options.status;
        if (options.unread_only)
            where.read_at = null;
        const { rows, count } = await models_1.Notification.findAndCountAll({
            where,
            include: [
                { model: models_1.Event, as: 'event', attributes: ['id', 'title', 'person_name', 'event_type', 'event_date'] },
                { model: models_1.Group, as: 'group', attributes: ['id', 'name'] },
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });
        return {
            notifications: rows.map((n) => n.toJSON()),
            pagination: {
                page,
                limit,
                total: count,
                total_pages: Math.ceil(count / limit),
            },
        };
    }
    // ══════════════════════════════════════════
    // GET notification stats for a user
    // ══════════════════════════════════════════
    async getUserNotificationStats(userId) {
        const total = await models_1.Notification.count({ where: { user_id: userId } });
        const sent = await models_1.Notification.count({ where: { user_id: userId, status: 'sent' } });
        const failed = await models_1.Notification.count({ where: { user_id: userId, status: 'failed' } });
        const pending = await models_1.Notification.count({ where: { user_id: userId, status: 'pending' } });
        return { total, sent, failed, pending };
    }
    // ══════════════════════════════════════════
    // GET channel configuration status
    // ══════════════════════════════════════════
    getChannelStatus() {
        return {
            push: { configured: (0, push_channel_1.isPushConfigured)(), name: 'Firebase Cloud Messaging' },
            sms: { configured: (0, sms_channel_1.isSMSConfigured)(), name: 'Twilio SMS' },
            whatsapp: { configured: (0, whatsapp_channel_1.isWhatsAppConfigured)(), name: 'WhatsApp Business API' },
            email: { configured: (0, email_channel_1.isEmailConfigured)(), name: 'SMTP Email' },
        };
    }
    // ══════════════════════════════════════════
    // SEND test notification
    // ══════════════════════════════════════════
    async sendTestNotification(userId, channel) {
        const user = await models_1.User.findByPk(userId);
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        const testTitle = '🔔 EventHub Test';
        const testBody = 'This is a test notification from EventHub!';
        switch (channel) {
            case 'push': {
                const result = await (0, push_channel_1.sendPushToUser)(userId, testTitle, testBody, { test: 'true' });
                return { success: result.success, message: result.success ? `Push sent to ${result.tokens_sent || 0} device(s)` : (result.error || 'Failed'), };
            }
            case 'sms': {
                if (!user.phone)
                    return { success: false, message: 'No phone number on profile' };
                const result = await (0, sms_channel_1.sendSMS)({ to: user.phone, body: `${testTitle}\n${testBody}` });
                return { success: result.success, message: result.success ? 'SMS sent' : (result.error || 'Failed') };
            }
            case 'whatsapp': {
                if (!user.phone)
                    return { success: false, message: 'No phone number on profile' };
                const result = await (0, whatsapp_channel_1.sendWhatsApp)({ to: user.phone, body: `${testTitle}\n${testBody}` });
                return { success: result.success, message: result.success ? 'WhatsApp sent' : (result.error || 'Failed') };
            }
            case 'email': {
                if (!user.email)
                    return { success: false, message: 'No email on profile' };
                const result = await (0, email_channel_1.sendEmail)({ to: user.email, subject: testTitle, html: `<p>${testBody}</p>` });
                return { success: result.success, message: result.success ? 'Email sent' : (result.error || 'Failed') };
            }
            default:
                return { success: false, message: 'Unknown channel' };
        }
    }
}
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map