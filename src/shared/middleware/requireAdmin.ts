import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendError } from '../utils/response';

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.user.is_admin) {
    sendError(res, 'Admin access required', 403);
    return;
  }

  next();
}
