import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Log incoming request
  logger.info(`→ ${req.method} ${req.path}`);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Color-code by status
    if (statusCode >= 500) {
      logger.error(`← ${req.method} ${req.path} ${statusCode} (${duration}ms)`);
    } else if (statusCode >= 400) {
      logger.warn(`← ${req.method} ${req.path} ${statusCode} (${duration}ms)`);
    } else {
      logger.info(`← ${req.method} ${req.path} ${statusCode} (${duration}ms)`);
    }
  });

  next();
}