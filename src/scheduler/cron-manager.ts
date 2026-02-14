// backend/src/scheduler/cron-manager.ts

import cron, { ScheduledTask } from 'node-cron';
import { SchedulerConfig } from './scheduler.config';
import { ExecutionGuard } from './execution-guard';
import { SchedulerLogger } from './scheduler.logger';
import { reminderService } from '../jobs/reminder.service';


const logger = new SchedulerLogger('CronManager');

export class CronManager {
  private tasks: Map<string, ScheduledTask> = new Map();
  private guard: ExecutionGuard;
  private isShuttingDown = false;
  private activeExecutions: Set<string> = new Set();

  constructor(private config: SchedulerConfig) {
    this.guard = new ExecutionGuard(config.instanceId, config.lockTtlSeconds);
  }

  /**
   * Register all CRON jobs and start the scheduler
   */
  start(): void {
    if (!this.config.enabled) {
      logger.warn('Scheduler is DISABLED (ENABLE_REMINDER_CRON != true)');
      return;
    }

    // Validate cron expression
    if (!cron.validate(this.config.reminderCron)) {
      logger.error(`Invalid CRON expression: "${this.config.reminderCron}"`);
      return;
    }

    logger.info('Starting scheduler', {
      instanceId: this.config.instanceId,
      cron: this.config.reminderCron,
      timezone: this.config.timezone,
      timeoutMs: this.config.executionTimeoutMs,
      lockTtlSeconds: this.config.lockTtlSeconds,
    });

    // Job 1: Daily reminder processing
    this.registerJob('daily-reminders', this.config.reminderCron, () =>
      this.executeDailyReminders()
    );

    // Job 2: Weekly lock cleanup (every Sunday at 3 AM)
    this.registerJob('lock-cleanup', '0 3 * * 0', () =>
      this.executeLockCleanup()
    );

    logger.info(`Scheduler started with ${this.tasks.size} registered jobs`);
  }

  /**
   * Stop all CRON jobs gracefully
   */
  async stop(): Promise<void> {
    this.isShuttingDown = true;
    logger.info('Stopping scheduler...');

    // Stop all cron schedules immediately (no new triggers)
    for (const [name, task] of this.tasks) {
      task.stop();
      logger.info(`Stopped job: ${name}`);
    }
    this.tasks.clear();

    // Wait for active executions to finish (up to 30s)
    if (this.activeExecutions.size > 0) {
      logger.info('Waiting for active executions to complete...', {
        active: Array.from(this.activeExecutions),
      });

      const maxWait = 30_000;
      const start = Date.now();

      while (this.activeExecutions.size > 0 && Date.now() - start < maxWait) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (this.activeExecutions.size > 0) {
        logger.warn('Force-stopping with active executions', {
          remaining: Array.from(this.activeExecutions),
        });
      }
    }

    logger.info('Scheduler stopped');
  }

  /**
   * Register a single CRON job
   */
  private registerJob(name: string, expression: string, handler: () => Promise<void>): void {
    const task = cron.schedule(
      expression,
      async () => {
        // NEVER let an unhandled error crash the process
        try {
          await handler();
        } catch (error) {
          logger.error(`Unhandled error in job "${name}"`, error);
        }
      },
      {
        scheduled: true,
        timezone: this.config.timezone,
      }
    );

    this.tasks.set(name, task);
    logger.info(`Registered job: "${name}" with schedule: "${expression}"`);
  }

  /**
   * Core daily reminder execution with locking and timeout
   */
  private async executeDailyReminders(): Promise<void> {
    const jobName = 'daily-reminders';

    if (this.isShuttingDown) {
      logger.warn('Skipping execution — server is shutting down');
      return;
    }

    if (this.activeExecutions.has(jobName)) {
      logger.warn('Skipping execution — previous run still active');
      return;
    }

    logger.info('CRON triggered: daily-reminders');

    // Step 1: Try to acquire distributed lock
    const lock = await this.guard.tryAcquire(jobName);

    if (!lock.acquired) {
      logger.info('Skipping execution — lock not acquired', { reason: lock.reason });
      return;
    }

    // Step 2: Execute with timeout protection
    this.activeExecutions.add(jobName);
    const startTime = Date.now();

    try {
      const result = await this.executeWithTimeout(
        () => reminderService.processReminders(),
        this.config.executionTimeoutMs
      );

      const durationMs = Date.now() - startTime;

      await this.guard.release(lock.lockId!, {
        success: true,
        message: typeof result === 'string' ? result : 'Completed successfully',
        durationMs,
      });

      logger.info('Daily reminders completed', { durationMs });
    } catch (error) {
      const durationMs = Date.now() - startTime;

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await this.guard.release(lock.lockId!, {
        success: false,
        message: errorMessage,
        durationMs,
      });

      logger.error('Daily reminders failed', error, { durationMs });
    } finally {
      this.activeExecutions.delete(jobName);
    }
  }

  /**
   * Periodic cleanup of old lock records
   */
  private async executeLockCleanup(): Promise<void> {
    logger.info('Running lock cleanup');
    await this.guard.pruneOldLocks(30);
  }

  /**
   * Execute an async function with a timeout
   */
  private executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Expose for health checks
   */
  getStatus(): {
    enabled: boolean;
    running: boolean;
    activeJobs: string[];
    registeredJobs: string[];
    instanceId: string;
  } {
    return {
      enabled: this.config.enabled,
      running: this.tasks.size > 0,
      activeJobs: Array.from(this.activeExecutions),
      registeredJobs: Array.from(this.tasks.keys()),
      instanceId: this.config.instanceId,
    };
  }
}