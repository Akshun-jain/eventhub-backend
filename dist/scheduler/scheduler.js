"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduler = startScheduler;
exports.stopScheduler = stopScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = __importDefault(require("../shared/utils/logger"));
const reminder_job_1 = require("../jobs/reminder.job");
let task = null;
function startScheduler() {
    if (process.env.ENABLE_REMINDER_CRON !== 'true') {
        logger_1.default.info('Reminder CRON disabled (ENABLE_REMINDER_CRON != true)');
        return;
    }
    logger_1.default.info('Starting reminder CRON scheduler...');
    // Runs every day at 9:00 AM
    task = node_cron_1.default.schedule('0 9 * * *', async () => {
        logger_1.default.info('CRON triggered → Processing reminders');
        try {
            await (0, reminder_job_1.triggerRemindersManually)();
            logger_1.default.info('CRON completed successfully');
        }
        catch (error) {
            logger_1.default.error('CRON failed:', error);
        }
    }, {
        timezone: 'UTC',
    });
}
function stopScheduler() {
    if (task) {
        task.stop();
        logger_1.default.info('Reminder CRON stopped');
    }
}
//# sourceMappingURL=scheduler.js.map