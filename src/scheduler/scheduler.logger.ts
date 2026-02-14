export class SchedulerLogger {
  private prefix: string;

  constructor(private context: string) {
    this.prefix = `[Scheduler:${context}]`;
  }

  private now(): string {
    return new Date().toISOString();
  }

  info(message: string, meta?: Record<string, unknown>): void {
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    console.log(`${this.now()} INFO ${this.prefix} ${message}${metaStr}`);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    console.warn(`${this.now()} WARN ${this.prefix} ${message}${metaStr}`);
  }

  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';

    let errStr = '';
    if (error instanceof Error) {
      errStr = ` | Error: ${error.message}\n${error.stack}`;
    } else if (error) {
      errStr = ` | Error: ${JSON.stringify(error)}`;
    }

    console.error(`${this.now()} ERROR ${this.prefix} ${message}${errStr}${metaStr}`);
  }
}
