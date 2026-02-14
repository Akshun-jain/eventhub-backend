"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const requireAdmin_1 = require("../../shared/middleware/requireAdmin");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// ── Notification history ──
router.get('/', (req, res, next) => notification_controller_1.notificationController.getUserNotifications(req, res, next));
// ── Stats ──
router.get('/stats', (req, res, next) => notification_controller_1.notificationController.getStats(req, res, next));
// ── Unread count ──
router.get('/unread-count', (req, res, next) => notification_controller_1.notificationController.getUnreadCount(req, res, next));
// ── Mark single as read ──
router.patch('/:id/read', (req, res, next) => notification_controller_1.notificationController.markAsRead(req, res, next));
// ── Mark all as read ──
router.patch('/read-all', (req, res, next) => notification_controller_1.notificationController.markAllAsRead(req, res, next));
// ── Device token management ──
router.post('/register-device', (req, res, next) => notification_controller_1.notificationController.registerDevice(req, res, next));
router.delete('/remove-device', (req, res, next) => notification_controller_1.notificationController.removeDevice(req, res, next));
router.get('/devices', (req, res, next) => notification_controller_1.notificationController.getUserDevices(req, res, next));
// ── Channel status ──
router.get('/channels', (req, res, next) => notification_controller_1.notificationController.getChannelStatus(req, res, next));
// ── Test notification ──
router.post('/test', (req, res, next) => notification_controller_1.notificationController.sendTest(req, res, next));
// ── Retry failed ──
router.post('/retry', requireAdmin_1.requireAdmin, (req, res, next) => notification_controller_1.notificationController.retryFailed(req, res, next));
exports.default = router;
//# sourceMappingURL=notification.routes.js.map