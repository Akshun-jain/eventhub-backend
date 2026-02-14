import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authMiddleware } from '../auth/auth.middleware';
import { requireAdmin } from '../../shared/middleware/requireAdmin';


const router = Router();

router.use(authMiddleware);

// ── Notification history ──
router.get('/', (req, res, next) =>
  notificationController.getUserNotifications(req, res, next)
);

// ── Stats ──
router.get('/stats', (req, res, next) =>
  notificationController.getStats(req, res, next)
);

// ── Unread count ──
router.get('/unread-count', (req, res, next) =>
  notificationController.getUnreadCount(req, res, next)
);

// ── Mark single as read ──
router.patch('/:id/read', (req, res, next) =>
  notificationController.markAsRead(req, res, next)
);

// ── Mark all as read ──
router.patch('/read-all', (req, res, next) =>
  notificationController.markAllAsRead(req, res, next)
);

// ── Device token management ──
router.post('/register-device', (req, res, next) =>
  notificationController.registerDevice(req, res, next)
);

router.delete('/remove-device', (req, res, next) =>
  notificationController.removeDevice(req, res, next)
);

router.get('/devices', (req, res, next) =>
  notificationController.getUserDevices(req, res, next)
);

// ── Channel status ──
router.get('/channels', (req, res, next) =>
  notificationController.getChannelStatus(req, res, next)
);

// ── Test notification ──
router.post('/test', (req, res, next) =>
  notificationController.sendTest(req, res, next)
);

// ── Retry failed ──
router.post('/retry',requireAdmin,(req, res, next) => notificationController.retryFailed(req, res, next));


export default router;