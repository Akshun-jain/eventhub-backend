import cron, { ScheduledTask } from 'node-cron';
import { reminderService } from './reminder.service';
import logger from '../shared/utils/logger';

let dailyReminderJob: ScheduledTask | null = null;
let occurrenceUpdateJob: ScheduledTask | null = null;

// ══════════════════════════════════════
// START ALL CRON JOBS
// ══════════════════════════════════════
export function startReminderJobs(): void {
  // ── Daily reminders at 09:00 server time ──
  dailyReminderJob = cron.schedule(
    '0 9 * * *',
    async () => {
      logger.info('⏰ Cron: Daily reminder job triggered');
      try {
        await reminderService.processReminders();
      } catch (error) {
        logger.error('⏰ Cron: Daily reminder job failed:', error);
      }
    },
    {
      timezone: 'UTC', // Change to your server timezone if needed
    }
  );

  // ── Advance past occurrences at midnight ──
  occurrenceUpdateJob = cron.schedule(
    '5 0 * * *',
    async () => {
      logger.info('⏰ Cron: Occurrence update job triggered');
      try {
        await reminderService.advancePastOccurrences();
      } catch (error) {
        logger.error('⏰ Cron: Occurrence update job failed:', error);
      }
    },
    {
      timezone: 'UTC',
    }
  );

  logger.info('⏰ Cron jobs registered:');
  logger.info('   • Daily reminders    → 09:00 UTC');
  logger.info('   • Occurrence advance  → 00:05 UTC');
}

// ══════════════════════════════════════
// STOP ALL CRON JOBS (for graceful shutdown)
// ══════════════════════════════════════
export function stopReminderJobs(): void {
  if (dailyReminderJob) {
    dailyReminderJob.stop();
    dailyReminderJob = null;
  }
  if (occurrenceUpdateJob) {
    occurrenceUpdateJob.stop();
    occurrenceUpdateJob = null;
  }
  logger.info('⏰ Cron jobs stopped');
}

// ══════════════════════════════════════
// MANUAL TRIGGER (for testing / admin endpoint)
// ══════════════════════════════════════
export async function triggerRemindersManually(): Promise<void> {
  logger.info('⏰ Manual reminder trigger requested');
  await reminderService.processReminders();
  await reminderService.advancePastOccurrences();
}