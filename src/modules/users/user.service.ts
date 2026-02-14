import { User } from '../../database/models';
import { AppError } from '../../shared/middleware/errorHandler';
import logger from '../../shared/utils/logger';

interface UpdateProfileInput {
  name?: string;
  email?: string;
  phone?: string;
  timezone?: string;
}

class UserService {
  // ── Get profile ──
  async getProfile(userId: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403);
    }
    return user.toSafeJSON();
  }

  // ── Update profile ──
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403);
    }

    // Check email uniqueness if changing
    if (input.email && input.email !== user.email) {
      const existing = await User.findOne({ where: { email: input.email } });
      if (existing) {
        throw new AppError('Email already in use', 409);
      }
    }

    // Check phone uniqueness if changing
    if (input.phone && input.phone !== user.phone) {
      const existing = await User.findOne({ where: { phone: input.phone } });
      if (existing) {
        throw new AppError('Phone number already in use', 409);
      }
    }

    // Build update object — only include provided fields
    const updateData: Record<string, any> = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.email !== undefined) updateData.email = input.email.trim().toLowerCase();
    if (input.phone !== undefined) updateData.phone = input.phone.trim();
    if (input.timezone !== undefined) updateData.timezone = input.timezone.trim();

    await user.update(updateData);

    logger.info(`User profile updated: ${userId}`);

    return user.toSafeJSON();
  }

  // ── Deactivate account ──
  async deactivateAccount(userId: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update({ is_active: false });

    logger.info(`User account deactivated: ${userId}`);
  }
}

export const userService = new UserService();