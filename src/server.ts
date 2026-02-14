import app from './app';
import { env } from './config/environment';
import { connectDatabase } from './config/database';
import logger from './shared/utils/logger';
import { initScheduler, shutdownScheduler } from './scheduler';



// Register all Sequelize models
import './database/models';

async function startServer(): Promise<void> {
  try {
    // 1️⃣ Connect to PostgreSQL
    logger.info('Connecting to database...');
    await connectDatabase();

    // 2️⃣ Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info('────────────────────────────────────');
      logger.info(`  EventHub API Server`);
      logger.info(`  Environment : ${env.NODE_ENV}`);
      logger.info(`  Port        : ${env.PORT}`);
      logger.info(`  Health      : http://localhost:${env.PORT}/health`);
      logger.info(`  Auth API    : http://localhost:${env.PORT}/api/auth`);
      logger.info(`  Users API   : http://localhost:${env.PORT}/api/users`);
      logger.info(`  Groups API  : http://localhost:${env.PORT}/api/groups`);
      logger.info(`  Events API  : http://localhost:${env.PORT}/api/events`);
      logger.info(`  Protected   : http://localhost:${env.PORT}/api/protected`);
      logger.info('────────────────────────────────────');

      // 3️⃣ Initialize Phase-8 Pro scheduler AFTER server starts
      initScheduler();
    });

    // ──────────────────────────────────────────
    // Graceful shutdown (PRODUCTION SAFE)
    // ──────────────────────────────────────────
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      try {
        // Stop scheduler first (let jobs finish safely)
        await shutdownScheduler();
        logger.info('Scheduler stopped');

        // Close HTTP server
        server.close(() => {
          logger.info('HTTP server closed');
          process.exit(0);
        });

        // Force exit after 30s if something hangs
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 30_000);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Server failed to start:', error);
    process.exit(1);
  }
}

// Crash safety handlers
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
