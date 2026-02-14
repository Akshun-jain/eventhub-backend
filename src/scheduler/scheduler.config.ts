export interface SchedulerConfig {
  enabled: boolean;
  reminderCron: string;
  timezone: string;
  executionTimeoutMs: number;
  lockTtlSeconds: number;
  instanceId: string;
}

function generateInstanceId(): string {
  const hostname = process.env.HOSTNAME || 'local';
  const pid = process.pid;
  const random = Math.random().toString(36).substring(2, 8);
  return `${hostname}-${pid}-${random}`;
}

export function loadSchedulerConfig(): SchedulerConfig {
  return {
    enabled: process.env.ENABLE_REMINDER_CRON === 'true',
    reminderCron: process.env.REMINDER_CRON_EXPRESSION || '0 9 * * *',
    timezone: process.env.REMINDER_CRON_TIMEZONE || 'UTC',
    executionTimeoutMs: parseInt(process.env.REMINDER_TIMEOUT_MS || '300000', 10),
    lockTtlSeconds: parseInt(process.env.REMINDER_LOCK_TTL_SECONDS || '600', 10),
    instanceId: generateInstanceId(),
  };
}
