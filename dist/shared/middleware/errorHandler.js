"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const logger_1 = __importDefault(require("../utils/logger"));
const response_1 = require("../utils/response");
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
function errorHandler(err, _req, res, _next) {
    logger_1.default.error(err.message, err.stack || '');
    if (err instanceof AppError) {
        (0, response_1.sendError)(res, err.message, err.statusCode);
        return;
    }
    if (err.name === 'SequelizeValidationError') {
        (0, response_1.sendError)(res, 'Validation error', 422);
        return;
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
        (0, response_1.sendError)(res, 'Resource already exists', 409);
        return;
    }
    if (err.name === 'JsonWebTokenError') {
        (0, response_1.sendError)(res, 'Invalid token', 401);
        return;
    }
    if (err.name === 'TokenExpiredError') {
        (0, response_1.sendError)(res, 'Token expired', 401);
        return;
    }
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;
    (0, response_1.sendError)(res, message, 500);
}
//# sourceMappingURL=errorHandler.js.map