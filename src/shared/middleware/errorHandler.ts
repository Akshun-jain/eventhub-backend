import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { sendError } from '../utils/response';

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(err.message, err.stack || '');

  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err.name === 'SequelizeValidationError') {
    sendError(res, 'Validation error', 422);
    return;
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    sendError(res, 'Resource already exists', 409);
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 401);
    return;
  }

  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  sendError(res, message, 500);
}
