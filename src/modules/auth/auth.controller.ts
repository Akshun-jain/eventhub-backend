import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../shared/utils/response';

class AuthController {
  // POST /api/auth/register
  async register(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, email, password, phone } = req.body;

      // ── Validation ──
      if (!name || !email || !password) {
        sendError(res, 'name, email, and password are required', 400);
        return;
      }

      if (typeof name !== 'string' || name.trim().length < 2) {
        sendError(res, 'Name must be at least 2 characters', 400);
        return;
      }

      if (typeof password !== 'string' || password.length < 8) {
        sendError(res, 'Password must be at least 8 characters', 400);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        sendError(res, 'Invalid email format', 400);
        return;
      }

      // ── Create ──
      const result = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone?.trim() || undefined,
      });

      sendSuccess(res, result, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/login
  async login(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        sendError(res, 'email and password are required', 400);
        return;
      }

      const result = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });

      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/me  (protected)
  async getMe(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await authService.getUserById(req.userId!);
      sendSuccess(res, { user }, 'User retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();