"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSchedulerConfig = loadSchedulerConfig;
function generateInstanceId() {
    const hostname = process.env.HOSTNAME || 'local';
    const pid = process.pid;
    const random = Math.random().toString(36).substring(2, 8);
    return `${hostname}-${pid}-${random}`;
}
function loadSchedulerConfig() {
    return {
        enabled: process.env.ENABLE_REMINDER_CRON === 'true',
        reminderCron: process.env.REMINDER_CRON_EXPRESSION || '0 9 * * *',
        timezone: process.env.REMINDER_CRON_TIMEZONE || 'UTC',
        executionTimeoutMs: parseInt(process.env.REMINDER_TIMEOUT_MS || '300000', 10),
        lockTtlSeconds: parseInt(process.env.REMINDER_LOCK_TTL_SECONDS || '600', 10),
        instanceId: generateInstanceId(),
    };
}
//# sourceMappingURL=scheduler.config.js.map