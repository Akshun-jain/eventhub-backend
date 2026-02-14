// backend/src/scheduler/execution-guard.ts

import { Op } from 'sequelize';
import SchedulerLock from '../database/models/SchedulerLock';
import { SchedulerLogger } from './scheduler.logger';

const logger = new SchedulerLogger('ExecutionGuard');

export interface LockResult {
  acquired: boolean;
  lockId?: number;
  reason?: string;
}

export interface ExecutionResult {
  success: boolean;
  message: string;
  durationMs: number;
}

export class ExecutionGuard {
  constructor(
    private instanceId: string,
    private lockTtlSeconds: number
  ) {}

  /**
   * Generate a date-based lock key to prevent duplicate runs on the same day.
   * Format: jobName:YYYY-MM-DD:HH (hourly granularity)
   */
  private generateLockKey(jobName: string): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const hour = now.getUTCHours().toString().padStart(2, '0');
    return `${jobName}:${dateStr}:${hour}`;
  }

  /**
   * Try to acquire a distributed lock.
   * Uses DB unique constraint for atomic locking — no Redis needed.
   */
  async tryAcquire(jobName: string): Promise<LockResult> {
    const lockKey = this.generateLockKey(jobName);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.lockTtlSeconds * 1000);

    try {
      // First: clean up any expired locks
      await this.releaseExpiredLocks();

      // Check if an active (non-expired) lock already exists for this key
      const existingLock = await SchedulerLock.findOne({
        where: {
          lockKey,
          status: 'acquired',
          expiresAt: { [Op.gt]: now },
        },
      });

      if (existingLock) {
        logger.warn('Lock already held', {
          jobName,
          lockKey,
          heldBy: existingLock.lockedBy,
          expiresAt: existingLock.expiresAt.toISOString(),
        });
        return {
          acquired: false,
          reason: `Lock held by ${existingLock.lockedBy} until ${existingLock.expiresAt.toISOString()}`,
        };
      }

      // Try to create the lock — unique constraint protects against races
      const lock = await SchedulerLock.create({
        jobName,
        lockKey,
        lockedBy: this.instanceId,
        lockedAt: now,
        expiresAt,
        status: 'acquired',
      });

      logger.info('Lock acquired', { jobName, lockKey, lockId: lock.id });

      return { acquired: true, lockId: lock.id };
    } catch (error: unknown) {
      // Unique constraint violation means another instance got the lock first
      if (
        error instanceof Error &&
        (error.name === 'SequelizeUniqueConstraintError' ||
         error.message.includes('unique') ||
         error.message.includes('duplicate'))
      ) {
        logger.warn('Lock race lost (unique constraint)', { jobName, lockKey });
        return {
          acquired: false,
          reason: 'Another instance acquired the lock simultaneously',
        };
      }

      logger.error('Failed to acquire lock', error, { jobName, lockKey });
      return { acquired: false, reason: 'Lock acquisition error' };
    }
  }

  /**
   * Release a lock after job execution completes
   */
  async release(lockId: number, result: ExecutionResult): Promise<void> {
    try {
      await SchedulerLock.update(
        {
          status: 'released',
          executionResult: JSON.stringify(result),
          executionDurationMs: result.durationMs,
        },
        { where: { id: lockId } }
      );

      logger.info('Lock released', { lockId, durationMs: result.durationMs });
    } catch (error) {
      logger.error('Failed to release lock', error, { lockId });
    }
  }

  /**
   * Clean up locks that have passed their TTL
   */
  private async releaseExpiredLocks(): Promise<void> {
    try {
      const [updatedCount] = await SchedulerLock.update(
        { status: 'expired' },
        {
          where: {
            status: 'acquired',
            expiresAt: { [Op.lt]: new Date() },
          },
        }
      );

      if (updatedCount > 0) {
        logger.warn('Released expired locks', { count: updatedCount });
      }
    } catch (error) {
      logger.error('Failed to clean expired locks', error);
    }
  }

  /**
   * Cleanup old lock records (run periodically)
   */
  async pruneOldLocks(retentionDays: number = 30): Promise<number> {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retentionDays);

      const deleted = await SchedulerLock.destroy({
        where: {
          createdAt: { [Op.lt]: cutoff },
          status: { [Op.in]: ['released', 'expired'] },
        },
      });

      if (deleted > 0) {
        logger.info('Pruned old lock records', { deleted, retentionDays });
      }

      return deleted;
    } catch (error) {
      logger.error('Failed to prune old locks', error);
      return 0;
    }
  }
}