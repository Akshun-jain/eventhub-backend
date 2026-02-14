"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const environment_1 = require("./config/environment");
const database_1 = require("./config/database");
const logger_1 = __importDefault(require("./shared/utils/logger"));
const reminder_job_1 = require("./jobs/reminder.job");
const scheduler_1 = require("./scheduler/scheduler");
// Register all models with Sequelize
require("./database/models");
async function startServer() {
    try {
        // 1. Connect to PostgreSQL
        logger_1.default.info('Connecting to database...');
        await (0, database_1.connectDatabase)();
        // 2. Start cron jobs
        (0, reminder_job_1.startReminderJobs)();
        // 3. Start HTTP server
        const server = app_1.default.listen(environment_1.env.PORT, () => {
            (0, scheduler_1.startScheduler)();
            logger_1.default.info('────────────────────────────────────');
            logger_1.default.info(`  EventHub API Server`);
            logger_1.default.info(`  Environment : ${environment_1.env.NODE_ENV}`);
            logger_1.default.info(`  Port        : ${environment_1.env.PORT}`);
            logger_1.default.info(`  Health      : http://localhost:${environment_1.env.PORT}/health`);
            logger_1.default.info(`  Auth API    : http://localhost:${environment_1.env.PORT}/api/auth`);
            logger_1.default.info(`  Users API   : http://localhost:${environment_1.env.PORT}/api/users`);
            logger_1.default.info(`  Groups API  : http://localhost:${environment_1.env.PORT}/api/groups`);
            logger_1.default.info(`  Events API  : http://localhost:${environment_1.env.PORT}/api/events`);
            logger_1.default.info(`  Protected   : http://localhost:${environment_1.env.PORT}/api/protected`);
            logger_1.default.info('────────────────────────────────────');
        });
        // ── Graceful shutdown ──
        const shutdown = (signal) => {
            logger_1.default.info(`${signal} received. Starting graceful shutdown...`);
            (0, scheduler_1.stopScheduler)();
            // Stop cron jobs first
            (0, reminder_job_1.stopReminderJobs)();
            server.close(() => {
                logger_1.default.info('HTTP server closed');
                process.exit(0);
            });
            // Force exit after 10 seconds
            setTimeout(() => {
                logger_1.default.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        logger_1.default.error('Server failed to start:', error);
        process.exit(1);
    }
}
// Crash handlers
process.on('unhandledRejection', (reason) => {
    logger_1.default.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught Exception:', error);
    process.exit(1);
});
startServer();
//# sourceMappingURL=server.js.map