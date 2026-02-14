"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_1 = __importDefault(require("../utils/logger"));
function requestLogger(req, res, next) {
    const startTime = Date.now();
    // Log incoming request
    logger_1.default.info(`→ ${req.method} ${req.path}`);
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        // Color-code by status
        if (statusCode >= 500) {
            logger_1.default.error(`← ${req.method} ${req.path} ${statusCode} (${duration}ms)`);
        }
        else if (statusCode >= 400) {
            logger_1.default.warn(`← ${req.method} ${req.path} ${statusCode} (${duration}ms)`);
        }
        else {
            logger_1.default.info(`← ${req.method} ${req.path} ${statusCode} (${duration}ms)`);
        }
    });
    next();
}
//# sourceMappingURL=requestLogger.js.map