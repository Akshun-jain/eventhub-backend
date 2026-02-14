import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../../shared/types';
import { sendError } from '../../shared/utils/response';
import { env } from '../../config/environment';
import { User } from '../../database/models';

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // 1. Extract token
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      sendError(res, 'No token provided', 401);
      return;
    }

    const token = header.split('Bearer ')[1];

    if (!token || token.trim() === '') {
      sendError(res, 'No token provided', 401);
      return;
    }

    // 2. Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };

    // 3. Load user from DB
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_active) {
      sendError(res, 'User not found or inactive', 401);
      return;
    }

    // 4. Attach to request
    req.userId = user.id;
    req.user = user.toJSON();

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendError(res, 'Token expired', 401);
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      sendError(res, 'Invalid token', 401);
      return;
    }

    sendError(res, 'Authentication failed', 401);
  }
}
