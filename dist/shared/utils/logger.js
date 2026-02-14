"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m',
};
function timestamp() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
}
const logger = {
    info(message, ...args) {
        console.log(`${colors.gray}${timestamp()}${colors.reset} ${colors.green}[INFO]${colors.reset} ${message}`, ...args);
    },
    error(message, ...args) {
        console.error(`${colors.gray}${timestamp()}${colors.reset} ${colors.red}[ERROR]${colors.reset} ${message}`, ...args);
    },
    warn(message, ...args) {
        console.warn(`${colors.gray}${timestamp()}${colors.reset} ${colors.yellow}[WARN]${colors.reset} ${message}`, ...args);
    },
    debug(message, ...args) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`${colors.gray}${timestamp()}${colors.reset} ${colors.blue}[DEBUG]${colors.reset} ${message}`, ...args);
        }
    },
};
exports.default = logger;
//# sourceMappingURL=logger.js.map