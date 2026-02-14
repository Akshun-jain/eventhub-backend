import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { notificationService } from './notification.service';
import { sendSuccess, sendError } from '../../shared/utils/response';

class NotificationController {
  // GET /api/notifications
  async getUserNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationService.getUserNotifications(req.userId!, {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        channel: req.query.channel as string | undefined,
        status: req.query.status as string | undefined,
        unread_only: req.query.unread_only === 'true',
      });
      sendSuccess(res, result, 'Notifications retrieved');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/notifications/stats
  async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await notificationService.getUserNotificationStats(req.userId!);
      sendSuccess(res, { stats }, 'Stats retrieved');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/notifications/unread-count
  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const counts = await notificationService.getUnreadCount(req.userId!);
      sendSuccess(res, counts, 'Unread count retrieved');
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/notifications/:id/read
  async markAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!id || !uuidRegex.test(id)) {
        sendError(res, 'Invalid notification ID', 400);
        return;
      }

      const notification = await notificationService.markAsRead(id, req.userId!);
      sendSuccess(res, { notification }, 'Marked as read');
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/notifications/read-all
  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await notificationService.markAllAsRead(req.userId!);
      sendSuccess(res, { marked_read: count }, `${count} notifications marked as read`);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/notifications/register-device
  async registerDevice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, platform, device_name } = req.body;

      if (!token || typeof token !== 'string' || token.trim() === '') {
        sendError(res, 'Device token is required', 400);
        return;
      }

      if (!platform || !['android', 'ios', 'web'].includes(platform)) {
        sendError(res, 'Platform must be android, ios, or web', 400);
        return;
      }

      if (device_name !== undefined && device_name !== null) {
        if (typeof device_name !== 'string' || device_name.length > 100) {
          sendError(res, 'Device name must be under 100 characters', 400);
          return;
        }
      }

      const result = await notificationService.registerDevice(req.userId!, {
        token: token.trim(),
        platform,
        device_name: device_name?.trim(),
      });

      sendSuccess(res, { device: result }, 'Device registered', 201);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/notifications/remove-device
  async removeDevice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;

      if (!token || typeof token !== 'string' || token.trim() === '') {
        sendError(res, 'Device token is required', 400);
        return;
      }

      await notificationService.removeDevice(req.userId!, token.trim());
      sendSuccess(res, null, 'Device removed');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/notifications/devices
  async getUserDevices(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const devices = await notificationService.getUserDevices(req.userId!);
      sendSuccess(res, { devices }, 'Devices retrieved');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/notifications/channels
  async getChannelStatus(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const channels = notificationService.getChannelStatus();
      sendSuccess(res, { channels }, 'Channel status retrieved');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/notifications/test
  async sendTest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { channel } = req.body;

      if (!channel || !['push', 'sms', 'whatsapp', 'email'].includes(channel)) {
        sendError(res, 'channel must be one of: push, sms, whatsapp, email', 400);
        return;
      }

      const result = await notificationService.sendTestNotification(req.userId!, channel);

      if (result.success) {
        sendSuccess(res, result, 'Test notification sent');
      } else {
        sendError(res, result.message, 400);
      }
    } catch (error) {
      next(error);
    }
  }

  // POST /api/notifications/retry
  async retryFailed(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await notificationService.retryFailedNotifications();
      sendSuccess(res, { retried: count }, `Retried ${count} notifications`);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();