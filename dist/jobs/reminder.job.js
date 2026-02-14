"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startReminderJobs = startReminderJobs;
exports.stopReminderJobs = stopReminderJobs;
exports.triggerRemindersManually = triggerRemindersManually;
const node_cron_1 = __importDefault(require("node-cron"));
const reminder_service_1 = require("./reminder.service");
const logger_1 = __importDefault(require("../shared/utils/logger"));
let dailyReminderJob = null;
let occurrenceUpdateJob = null;
// ══════════════════════════════════════
// START ALL CRON JOBS
// ══════════════════════════════════════
function startReminderJobs() {
    // ── Daily reminders at 09:00 server time ──
    dailyReminderJob = node_cron_1.default.schedule('0 9 * * *', async () => {
        logger_1.default.info('⏰ Cron: Daily reminder job triggered');
        try {
            await reminder_service_1.reminderService.processReminders();
        }
        catch (error) {
            logger_1.default.error('⏰ Cron: Daily reminder job failed:', error);
        }
    }, {
        timezone: 'UTC', // Change to your server timezone if needed
    });
    // ── Advance past occurrences at midnight ──
    occurrenceUpdateJob = node_cron_1.default.schedule('5 0 * * *', async () => {
        logger_1.default.info('⏰ Cron: Occurrence update job triggered');
        try {
            await reminder_service_1.reminderService.advancePastOccurrences();
        }
        catch (error) {
            logger_1.default.error('⏰ Cron: Occurrence update job failed:', error);
        }
    }, {
        timezone: 'UTC',
    });
    logger_1.default.info('⏰ Cron jobs registered:');
    logger_1.default.info('   • Daily reminders    → 09:00 UTC');
    logger_1.default.info('   • Occurrence advance  → 00:05 UTC');
}
// ══════════════════════════════════════
// STOP ALL CRON JOBS (for graceful shutdown)
// ══════════════════════════════════════
function stopReminderJobs() {
    if (dailyReminderJob) {
        dailyReminderJob.stop();
        dailyReminderJob = null;
    }
    if (occurrenceUpdateJob) {
        occurrenceUpdateJob.stop();
        occurrenceUpdateJob = null;
    }
    logger_1.default.info('⏰ Cron jobs stopped');
}
// ══════════════════════════════════════
// MANUAL TRIGGER (for testing / admin endpoint)
// ══════════════════════════════════════
async function triggerRemindersManually() {
    logger_1.default.info('⏰ Manual reminder trigger requested');
    await reminder_service_1.reminderService.processReminders();
    await reminder_service_1.reminderService.advancePastOccurrences();
}
//# sourceMappingURL=reminder.job.js.map