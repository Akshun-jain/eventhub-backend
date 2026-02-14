"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initScheduler = initScheduler;
exports.shutdownScheduler = shutdownScheduler;
exports.getSchedulerStatus = getSchedulerStatus;
const cron_manager_1 = require("./cron-manager");
const scheduler_config_1 = require("./scheduler.config");
const scheduler_logger_1 = require("./scheduler.logger");
const logger = new scheduler_logger_1.SchedulerLogger('Init');
let cronManager = null;
let schedulerConfig = null;
/**
 * Initialize and start the scheduler.
 * Call AFTER database connection is ready.
 */
function initScheduler() {
    if (cronManager) {
        logger.warn('Scheduler already initialized — skipping');
        return;
    }
    schedulerConfig = (0, scheduler_config_1.loadSchedulerConfig)();
    cronManager = new cron_manager_1.CronManager(schedulerConfig);
    cronManager.start();
}
/**
 * Gracefully stop scheduler.
 */
async function shutdownScheduler() {
    if (!cronManager)
        return;
    await cronManager.stop();
    cronManager = null;
    schedulerConfig = null;
}
/**
 * Health/status helper.
 */
function getSchedulerStatus() {
    if (!cronManager) {
        return {
            enabled: false,
            running: false,
            activeJobs: [],
            registeredJobs: [],
            instanceId: 'not-initialized',
        };
    }
    return cronManager.getStatus();
}
//# sourceMappingURL=index.js.map