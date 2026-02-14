"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerLogger = void 0;
class SchedulerLogger {
    constructor(context) {
        this.context = context;
        this.prefix = `[Scheduler:${context}]`;
    }
    now() {
        return new Date().toISOString();
    }
    info(message, meta) {
        const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
        console.log(`${this.now()} INFO ${this.prefix} ${message}${metaStr}`);
    }
    warn(message, meta) {
        const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
        console.warn(`${this.now()} WARN ${this.prefix} ${message}${metaStr}`);
    }
    error(message, error, meta) {
        const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
        let errStr = '';
        if (error instanceof Error) {
            errStr = ` | Error: ${error.message}\n${error.stack}`;
        }
        else if (error) {
            errStr = ` | Error: ${JSON.stringify(error)}`;
        }
        console.error(`${this.now()} ERROR ${this.prefix} ${message}${errStr}${metaStr}`);
    }
}
exports.SchedulerLogger = SchedulerLogger;
//# sourceMappingURL=scheduler.logger.js.map