import cron from 'node-cron';
import logger from '../shared/utils/logger';
import { triggerRemindersManually } from '../jobs/reminder.job';

let task: cron.ScheduledTask | null = null;

export function startScheduler() {
  if (process.env.ENABLE_REMINDER_CRON !== 'true') {
    logger.info('Reminder CRON disabled (ENABLE_REMINDER_CRON != true)');
    return;
  }

  logger.info('Starting reminder CRON scheduler...');

  // Runs every day at 9:00 AM
  task = cron.schedule(
    '0 9 * * *',
    async () => {
      logger.info('CRON triggered → Processing reminders');

      try {
        await triggerRemindersManually();
        logger.info('CRON completed successfully');
      } catch (error: any) {
        logger.error('CRON failed:', error);
      }
    },
    {
      timezone: 'UTC',
    }
  );
}

export function stopScheduler() {
  if (task) {
    task.stop();
    logger.info('Reminder CRON stopped');
  }
}
