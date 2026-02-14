"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reminderService = exports.ReminderService = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../database/models");
const notification_service_1 = require("../modules/notifications/notification.service");
const logger_1 = __importDefault(require("../shared/utils/logger"));
function getTodayString() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
function getFutureDateString(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
function daysBetween(fromStr, toStr) {
    const from = new Date(fromStr + 'T00:00:00Z');
    const to = new Date(toStr + 'T00:00:00Z');
    return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}
class ReminderService {
    async processReminders() {
        const startTime = Date.now();
        const today = getTodayString();
        logger_1.default.info('═══ Reminder Processing Started ═══');
        logger_1.default.info(`Today: ${today}`);
        try {
            const sameDayTargets = await this.findSameDayReminders(today);
            const advanceTargets = await this.findAdvanceReminders(today);
            const allTargets = this.deduplicateTargets([...sameDayTargets, ...advanceTargets]);
            logger_1.default.info(`Found ${sameDayTargets.length} same-day + ${advanceTargets.length} advance = ${allTargets.length} total reminders`);
            let sentCount = 0;
            let failCount = 0;
            for (const target of allTargets) {
                const results = await notification_service_1.notificationService.dispatchReminder(target);
                for (const r of results) {
                    if (r.success) {
                        sentCount++;
                    }
                    else {
                        failCount++;
                    }
                }
            }
            // Retry any recently failed
            await notification_service_1.notificationService.retryFailedNotifications();
            const duration = Date.now() - startTime;
            logger_1.default.info(`═══ Reminder Processing Complete (${duration}ms) ═══`);
            logger_1.default.info(`Dispatched: ${sentCount} sent, ${failCount} failed across ${allTargets.length} targets`);
        }
        catch (error) {
            logger_1.default.error('Reminder processing failed:', error);
        }
    }
    async findSameDayReminders(today) {
        const events = await models_1.Event.findAll({
            where: {
                is_active: true,
                remind_on_day: true,
                next_occurrence: today,
            },
            include: [
                { model: models_1.Group, as: 'group', attributes: ['id', 'name'] },
            ],
        });
        if (events.length === 0) {
            logger_1.default.info('No same-day events found');
            return [];
        }
        logger_1.default.info(`Found ${events.length} same-day events`);
        const targets = [];
        for (const event of events) {
            const eventData = event.toJSON();
            const members = await this.getNotifiableMembers(eventData.group_id);
            for (const member of members) {
                targets.push({
                    user_id: member.user_id,
                    user_name: member.user_name,
                    user_email: member.user_email,
                    user_phone: member.user_phone || undefined,
                    event_id: eventData.id,
                    event_title: eventData.title,
                    person_name: eventData.person_name,
                    event_type: eventData.event_type,
                    event_date: eventData.event_date,
                    next_occurrence: eventData.next_occurrence,
                    group_id: eventData.group_id,
                    group_name: eventData.group?.name || 'Unknown Group',
                    days_until: 0,
                    reminder_type: 'same_day',
                    notify_push: member.notify_push,
                    notify_sms: member.notify_sms,
                    notify_whatsapp: member.notify_whatsapp,
                    notify_email: member.notify_email,
                    notes: eventData.notes || undefined,
                });
            }
        }
        return targets;
    }
    async findAdvanceReminders(today) {
        const tomorrowStr = getFutureDateString(1);
        const maxDateStr = getFutureDateString(30);
        const events = await models_1.Event.findAll({
            where: {
                is_active: true,
                remind_days_before: { [sequelize_1.Op.not]: '[]' },
                next_occurrence: { [sequelize_1.Op.between]: [tomorrowStr, maxDateStr] },
            },
            include: [
                { model: models_1.Group, as: 'group', attributes: ['id', 'name'] },
            ],
        });
        if (events.length === 0) {
            logger_1.default.info('No advance reminder candidates found');
            return [];
        }
        const targets = [];
        for (const event of events) {
            const eventData = event.toJSON();
            const daysUntilEvent = daysBetween(today, eventData.next_occurrence);
            const remindDays = eventData.remind_days_before || [];
            if (!remindDays.includes(daysUntilEvent)) {
                continue;
            }
            const members = await this.getNotifiableMembers(eventData.group_id);
            for (const member of members) {
                targets.push({
                    user_id: member.user_id,
                    user_name: member.user_name,
                    user_email: member.user_email,
                    user_phone: member.user_phone || undefined,
                    event_id: eventData.id,
                    event_title: eventData.title,
                    person_name: eventData.person_name,
                    event_type: eventData.event_type,
                    event_date: eventData.event_date,
                    next_occurrence: eventData.next_occurrence,
                    group_id: eventData.group_id,
                    group_name: eventData.group?.name || 'Unknown Group',
                    days_until: daysUntilEvent,
                    reminder_type: 'advance',
                    notify_push: member.notify_push,
                    notify_sms: member.notify_sms,
                    notify_whatsapp: member.notify_whatsapp,
                    notify_email: member.notify_email,
                    notes: eventData.notes || undefined,
                });
            }
        }
        logger_1.default.info(`Found ${targets.length} advance reminder targets`);
        return targets;
    }
    async getNotifiableMembers(groupId) {
        const members = await models_1.GroupMember.findAll({
            where: {
                group_id: groupId,
                status: 'active',
                // At least one notification channel enabled
                [sequelize_1.Op.or]: [
                    { notify_push: true },
                    { notify_sms: true },
                    { notify_whatsapp: true },
                    { notify_email: true },
                ],
            },
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'name', 'email', 'phone'],
                    where: { is_active: true },
                },
            ],
        });
        return members.map((m) => {
            const raw = m.toJSON();
            return {
                user_id: raw.user.id,
                user_name: raw.user.name,
                user_email: raw.user.email,
                user_phone: raw.user.phone,
                notify_push: raw.notify_push,
                notify_sms: raw.notify_sms,
                notify_whatsapp: raw.notify_whatsapp,
                notify_email: raw.notify_email,
            };
        });
    }
    deduplicateTargets(targets) {
        const seen = new Set();
        const unique = [];
        for (const target of targets) {
            const key = `${target.user_id}:${target.event_id}:${target.days_until}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(target);
            }
        }
        return unique;
    }
    async advancePastOccurrences() {
        const today = getTodayString();
        const pastEvents = await models_1.Event.findAll({
            where: {
                is_active: true,
                next_occurrence: { [sequelize_1.Op.lt]: today },
                recurrence: { [sequelize_1.Op.ne]: 'none' },
            },
        });
        if (pastEvents.length > 0) {
            logger_1.default.info(`Advancing ${pastEvents.length} past recurring events`);
            for (const event of pastEvents) {
                const newNext = this.calculateAdvancedOccurrence(event.next_occurrence, event.recurrence);
                if (newNext) {
                    await event.update({ next_occurrence: newNext });
                    logger_1.default.info(`  Event ${event.id}: ${event.next_occurrence} → ${newNext}`);
                }
            }
        }
        const deactivated = await models_1.Event.update({ is_active: false }, {
            where: {
                is_active: true,
                recurrence: 'none',
                next_occurrence: { [sequelize_1.Op.lt]: today },
            },
        });
        if (deactivated[0] > 0) {
            logger_1.default.info(`Deactivated ${deactivated[0]} past one-time events`);
        }
    }
    calculateAdvancedOccurrence(currentDateStr, recurrence) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const current = new Date(currentDateStr + 'T00:00:00Z');
        switch (recurrence) {
            case 'yearly':
                while (current <= today)
                    current.setUTCFullYear(current.getUTCFullYear() + 1);
                break;
            case 'monthly':
                while (current <= today)
                    current.setUTCMonth(current.getUTCMonth() + 1);
                break;
            case 'weekly':
                while (current <= today)
                    current.setUTCDate(current.getUTCDate() + 7);
                break;
            default:
                return null;
        }
        const yyyy = current.getUTCFullYear();
        const mm = String(current.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(current.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
}
exports.ReminderService = ReminderService;
exports.reminderService = new ReminderService();
//# sourceMappingURL=reminder.service.js.map