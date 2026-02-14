import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { userService } from './user.service';
import { sendSuccess, sendError } from '../../shared/utils/response';

class UserController {
  // GET /api/users/profile
  async getProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await userService.getProfile(req.userId!);
      sendSuccess(res, { user }, 'Profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/users/profile
  async updateProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, email, phone, timezone } = req.body;

      // At least one field required
      if (!name && !email && !phone && !timezone) {
        sendError(res, 'At least one field is required to update', 400);
        return;
      }

      // Validate fields if provided
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
          sendError(res, 'Name must be 2-100 characters', 400);
          return;
        }
      }

      if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
          sendError(res, 'Invalid email format', 400);
          return;
        }
      }

      if (phone !== undefined) {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (typeof phone !== 'string' || !phoneRegex.test(phone.trim())) {
          sendError(res, 'Phone must be in E.164 format (+1234567890)', 400);
          return;
        }
      }

      if (timezone !== undefined) {
        if (typeof timezone !== 'string' || timezone.trim().length > 50) {
          sendError(res, 'Timezone must be a string under 50 characters', 400);
          return;
        }
      }

      const user = await userService.updateProfile(req.userId!, {
        name,
        email,
        phone,
        timezone,
      });

      sendSuccess(res, { user }, 'Profile updated');
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/users/account
  async deleteAccount(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await userService.deactivateAccount(req.userId!);
      sendSuccess(res, null, 'Account deactivated');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();