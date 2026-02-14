import { CronManager } from './cron-manager';
import { loadSchedulerConfig, SchedulerConfig } from './scheduler.config';
import { SchedulerLogger } from './scheduler.logger';

const logger = new SchedulerLogger('Init');

let cronManager: CronManager | null = null;
let schedulerConfig: SchedulerConfig | null = null;

/**
 * Initialize and start the scheduler.
 * Call AFTER database connection is ready.
 */
export function initScheduler(): void {
  if (cronManager) {
    logger.warn('Scheduler already initialized — skipping');
    return;
  }

  schedulerConfig = loadSchedulerConfig();
  cronManager = new CronManager(schedulerConfig);
  cronManager.start();
}

/**
 * Gracefully stop scheduler.
 */
export async function shutdownScheduler(): Promise<void> {
  if (!cronManager) return;

  await cronManager.stop();
  cronManager = null;
  schedulerConfig = null;
}

/**
 * Health/status helper.
 */
export function getSchedulerStatus() {
  if (!cronManager) {
    return {
      enabled: false,
      running: false,
      activeJobs: [],
      registeredJobs: [],
      instanceId: 'not-initialized',
    };
  }

  return cronManager.getStatus();
}
