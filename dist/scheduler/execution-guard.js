"use strict";
// backend/src/scheduler/execution-guard.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionGuard = void 0;
const sequelize_1 = require("sequelize");
const SchedulerLock_1 = __importDefault(require("../database/models/SchedulerLock"));
const scheduler_logger_1 = require("./scheduler.logger");
const logger = new scheduler_logger_1.SchedulerLogger('ExecutionGuard');
class ExecutionGuard {
    constructor(instanceId, lockTtlSeconds) {
        this.instanceId = instanceId;
        this.lockTtlSeconds = lockTtlSeconds;
    }
    /**
     * Generate a date-based lock key to prevent duplicate runs on the same day.
     * Format: jobName:YYYY-MM-DD:HH (hourly granularity)
     */
    generateLockKey(jobName) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const hour = now.getUTCHours().toString().padStart(2, '0');
        return `${jobName}:${dateStr}:${hour}`;
    }
    /**
     * Try to acquire a distributed lock.
     * Uses DB unique constraint for atomic locking — no Redis needed.
     */
    async tryAcquire(jobName) {
        const lockKey = this.generateLockKey(jobName);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.lockTtlSeconds * 1000);
        try {
            // First: clean up any expired locks
            await this.releaseExpiredLocks();
            // Check if an active (non-expired) lock already exists for this key
            const existingLock = await SchedulerLock_1.default.findOne({
                where: {
                    lockKey,
                    status: 'acquired',
                    expiresAt: { [sequelize_1.Op.gt]: now },
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
            const lock = await SchedulerLock_1.default.create({
                jobName,
                lockKey,
                lockedBy: this.instanceId,
                lockedAt: now,
                expiresAt,
                status: 'acquired',
            });
            logger.info('Lock acquired', { jobName, lockKey, lockId: lock.id });
            return { acquired: true, lockId: lock.id };
        }
        catch (error) {
            // Unique constraint violation means another instance got the lock first
            if (error instanceof Error &&
                (error.name === 'SequelizeUniqueConstraintError' ||
                    error.message.includes('unique') ||
                    error.message.includes('duplicate'))) {
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
    async release(lockId, result) {
        try {
            await SchedulerLock_1.default.update({
                status: 'released',
                executionResult: JSON.stringify(result),
                executionDurationMs: result.durationMs,
            }, { where: { id: lockId } });
            logger.info('Lock released', { lockId, durationMs: result.durationMs });
        }
        catch (error) {
            logger.error('Failed to release lock', error, { lockId });
        }
    }
    /**
     * Clean up locks that have passed their TTL
     */
    async releaseExpiredLocks() {
        try {
            const [updatedCount] = await SchedulerLock_1.default.update({ status: 'expired' }, {
                where: {
                    status: 'acquired',
                    expiresAt: { [sequelize_1.Op.lt]: new Date() },
                },
            });
            if (updatedCount > 0) {
                logger.warn('Released expired locks', { count: updatedCount });
            }
        }
        catch (error) {
            logger.error('Failed to clean expired locks', error);
        }
    }
    /**
     * Cleanup old lock records (run periodically)
     */
    async pruneOldLocks(retentionDays = 30) {
        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - retentionDays);
            const deleted = await SchedulerLock_1.default.destroy({
                where: {
                    createdAt: { [sequelize_1.Op.lt]: cutoff },
                    status: { [sequelize_1.Op.in]: ['released', 'expired'] },
                },
            });
            if (deleted > 0) {
                logger.info('Pruned old lock records', { deleted, retentionDays });
            }
            return deleted;
        }
        catch (error) {
            logger.error('Failed to prune old locks', error);
            return 0;
        }
    }
}
exports.ExecutionGuard = ExecutionGuard;
//# sourceMappingURL=execution-guard.js.map