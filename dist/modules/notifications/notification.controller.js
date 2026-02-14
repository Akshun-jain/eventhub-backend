"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = void 0;
const notification_service_1 = require("./notification.service");
const response_1 = require("../../shared/utils/response");
class NotificationController {
    // GET /api/notifications
    async getUserNotifications(req, res, next) {
        try {
            const result = await notification_service_1.notificationService.getUserNotifications(req.userId, {
                page: req.query.page ? parseInt(req.query.page, 10) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
                channel: req.query.channel,
                status: req.query.status,
                unread_only: req.query.unread_only === 'true',
            });
            (0, response_1.sendSuccess)(res, result, 'Notifications retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/notifications/stats
    async getStats(req, res, next) {
        try {
            const stats = await notification_service_1.notificationService.getUserNotificationStats(req.userId);
            (0, response_1.sendSuccess)(res, { stats }, 'Stats retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/notifications/unread-count
    async getUnreadCount(req, res, next) {
        try {
            const counts = await notification_service_1.notificationService.getUnreadCount(req.userId);
            (0, response_1.sendSuccess)(res, counts, 'Unread count retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // PATCH /api/notifications/:id/read
    async markAsRead(req, res, next) {
        try {
            const { id } = req.params;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!id || !uuidRegex.test(id)) {
                (0, response_1.sendError)(res, 'Invalid notification ID', 400);
                return;
            }
            const notification = await notification_service_1.notificationService.markAsRead(id, req.userId);
            (0, response_1.sendSuccess)(res, { notification }, 'Marked as read');
        }
        catch (error) {
            next(error);
        }
    }
    // PATCH /api/notifications/read-all
    async markAllAsRead(req, res, next) {
        try {
            const count = await notification_service_1.notificationService.markAllAsRead(req.userId);
            (0, response_1.sendSuccess)(res, { marked_read: count }, `${count} notifications marked as read`);
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/notifications/register-device
    async registerDevice(req, res, next) {
        try {
            const { token, platform, device_name } = req.body;
            if (!token || typeof token !== 'string' || token.trim() === '') {
                (0, response_1.sendError)(res, 'Device token is required', 400);
                return;
            }
            if (!platform || !['android', 'ios', 'web'].includes(platform)) {
                (0, response_1.sendError)(res, 'Platform must be android, ios, or web', 400);
                return;
            }
            if (device_name !== undefined && device_name !== null) {
                if (typeof device_name !== 'string' || device_name.length > 100) {
                    (0, response_1.sendError)(res, 'Device name must be under 100 characters', 400);
                    return;
                }
            }
            const result = await notification_service_1.notificationService.registerDevice(req.userId, {
                token: token.trim(),
                platform,
                device_name: device_name?.trim(),
            });
            (0, response_1.sendSuccess)(res, { device: result }, 'Device registered', 201);
        }
        catch (error) {
            next(error);
        }
    }
    // DELETE /api/notifications/remove-device
    async removeDevice(req, res, next) {
        try {
            const { token } = req.body;
            if (!token || typeof token !== 'string' || token.trim() === '') {
                (0, response_1.sendError)(res, 'Device token is required', 400);
                return;
            }
            await notification_service_1.notificationService.removeDevice(req.userId, token.trim());
            (0, response_1.sendSuccess)(res, null, 'Device removed');
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/notifications/devices
    async getUserDevices(req, res, next) {
        try {
            const devices = await notification_service_1.notificationService.getUserDevices(req.userId);
            (0, response_1.sendSuccess)(res, { devices }, 'Devices retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/notifications/channels
    async getChannelStatus(_req, res, next) {
        try {
            const channels = notification_service_1.notificationService.getChannelStatus();
            (0, response_1.sendSuccess)(res, { channels }, 'Channel status retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/notifications/test
    async sendTest(req, res, next) {
        try {
            const { channel } = req.body;
            if (!channel || !['push', 'sms', 'whatsapp', 'email'].includes(channel)) {
                (0, response_1.sendError)(res, 'channel must be one of: push, sms, whatsapp, email', 400);
                return;
            }
            const result = await notification_service_1.notificationService.sendTestNotification(req.userId, channel);
            if (result.success) {
                (0, response_1.sendSuccess)(res, result, 'Test notification sent');
            }
            else {
                (0, response_1.sendError)(res, result.message, 400);
            }
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/notifications/retry
    async retryFailed(req, res, next) {
        try {
            const count = await notification_service_1.notificationService.retryFailedNotifications();
            (0, response_1.sendSuccess)(res, { retried: count }, `Retried ${count} notifications`);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.notificationController = new NotificationController();
//# sourceMappingURL=notification.controller.js.map