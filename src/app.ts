import express from 'express';
import helmet from 'helmet';
import { requireAdmin } from './shared/middleware/requireAdmin';

import { corsMiddleware } from './shared/middleware/cors';
import { requestLogger } from './shared/middleware/requestLogger';
import { globalLimiter } from './shared/middleware/rateLimiter';
import { errorHandler } from './shared/middleware/errorHandler';
import { authMiddleware } from './modules/auth/auth.middleware';
import { sendSuccess, sendError } from './shared/utils/response';
import { AuthRequest } from './shared/types';
import { triggerRemindersManually } from './jobs/reminder.job';
import { sequelize } from './config/database';
import { getSchedulerStatus } from './scheduler';


// Route imports
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import groupRoutes from './modules/groups/group.routes';
import eventRoutes from './modules/events/event.routes';
import notificationRoutes from './modules/notifications/notification.routes';



const app = express();

// ── Security ──
app.use(helmet());
app.use(corsMiddleware);

// ── Body parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging (skip in production for performance if needed) ──
app.use(requestLogger);

// ── Rate limiting ──
app.use('/api', globalLimiter);

// ── Health check (basic — always returns 200 if process is alive) ──
app.get('/health', (_req, res) => {
  const scheduler = getSchedulerStatus();
  sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    scheduler: {
      enabled: scheduler.enabled,
      running: scheduler.running,
      activeJobs: scheduler.activeJobs,
      registeredJobs: scheduler.registeredJobs,
      instanceId: scheduler.instanceId,
    }
  });
});

// ── Readiness check (deep — verifies DB connection) ──
app.get('/ready', async (_req, res) => {
  try {
    await sequelize.authenticate();

    sendSuccess(res, {
      status: 'ready',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: `${Math.floor(process.uptime())}s`,
    });
  } catch (error: any) {
    sendError(res, `Not ready: ${error.message}`, 503);
  }
});

// ── API routes ──
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);

// ── Manual reminder trigger ──
app.post('/api/reminders/trigger', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await triggerRemindersManually();
    sendSuccess(res, {
      triggered_at: new Date().toISOString(),
      triggered_by: req.userId,
    }, 'Reminders processed');
  } catch (error: any) {
    sendError(res, error.message || 'Reminder trigger failed', 500);
  }
});

// ── Protected test route ──
app.get('/api/protected', authMiddleware,requireAdmin, (req: AuthRequest, res) => {
  sendSuccess(res, {
    message: 'You accessed a protected route!',
    userId: req.userId,
    accessedAt: new Date().toISOString(),
  });
});

// ── 404 ──
app.use((_req, res) => {
  sendError(res, 'Route not found', 404);
});

// ── Error handler ──
app.use(errorHandler);

export default app;