"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const requireAdmin_1 = require("./shared/middleware/requireAdmin");
const cors_1 = require("./shared/middleware/cors");
const requestLogger_1 = require("./shared/middleware/requestLogger");
const rateLimiter_1 = require("./shared/middleware/rateLimiter");
const errorHandler_1 = require("./shared/middleware/errorHandler");
const auth_middleware_1 = require("./modules/auth/auth.middleware");
const response_1 = require("./shared/utils/response");
const reminder_job_1 = require("./jobs/reminder.job");
const database_1 = require("./config/database");
// Route imports
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("./modules/users/user.routes"));
const group_routes_1 = __importDefault(require("./modules/groups/group.routes"));
const event_routes_1 = __importDefault(require("./modules/events/event.routes"));
const notification_routes_1 = __importDefault(require("./modules/notifications/notification.routes"));
const app = (0, express_1.default)();
// ── Security ──
app.use((0, helmet_1.default)());
app.use(cors_1.corsMiddleware);
// ── Body parsing ──
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ── Logging (skip in production for performance if needed) ──
app.use(requestLogger_1.requestLogger);
// ── Rate limiting ──
app.use('/api', rateLimiter_1.globalLimiter);
// ── Health check (basic — always returns 200 if process is alive) ──
app.get('/health', (_req, res) => {
    (0, response_1.sendSuccess)(res, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
    });
});
// ── Readiness check (deep — verifies DB connection) ──
app.get('/ready', async (_req, res) => {
    try {
        await database_1.sequelize.authenticate();
        (0, response_1.sendSuccess)(res, {
            status: 'ready',
            timestamp: new Date().toISOString(),
            database: 'connected',
            uptime: `${Math.floor(process.uptime())}s`,
        });
    }
    catch (error) {
        (0, response_1.sendError)(res, `Not ready: ${error.message}`, 503);
    }
});
// ── API routes ──
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/groups', group_routes_1.default);
app.use('/api/events', event_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
// ── Manual reminder trigger ──
app.post('/api/reminders/trigger', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        await (0, reminder_job_1.triggerRemindersManually)();
        (0, response_1.sendSuccess)(res, {
            triggered_at: new Date().toISOString(),
            triggered_by: req.userId,
        }, 'Reminders processed');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Reminder trigger failed', 500);
    }
});
// ── Protected test route ──
app.get('/api/protected', auth_middleware_1.authMiddleware, requireAdmin_1.requireAdmin, (req, res) => {
    (0, response_1.sendSuccess)(res, {
        message: 'You accessed a protected route!',
        userId: req.userId,
        accessedAt: new Date().toISOString(),
    });
});
// ── 404 ──
app.use((_req, res) => {
    (0, response_1.sendError)(res, 'Route not found', 404);
});
// ── Error handler ──
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map