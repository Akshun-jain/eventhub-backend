import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User } from '../../database/models';
import { env } from '../../config/environment';
import { AppError } from '../../shared/middleware/errorHandler';
import logger from '../../shared/utils/logger';

const SALT_ROUNDS = 12;

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResult {
  user: Omit<import('../../database/models/user.model').UserAttributes, 'password_hash'>;
  token: string;
}

class AuthService {
  // ── Register ──
  async register(input: RegisterInput): Promise<AuthResult> {
    // Check duplicate email
    const existing = await User.findOne({ where: { email: input.email } });
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    // Check duplicate phone if provided
    if (input.phone) {
      const phoneExists = await User.findOne({ where: { phone: input.phone } });
      if (phoneExists) {
        throw new AppError('Phone number already registered', 409);
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user
    const user = await User.create({
      name: input.name,
      email: input.email,
      password_hash,
      phone: input.phone || null,
    });

    const token = this.generateToken(user.id);

    logger.info(`User registered: ${user.email} (${user.id})`);

    return { user: user.toSafeJSON(), token };
  }

  // ── Login ──
  async login(input: LoginInput): Promise<AuthResult> {
    // Find user by email
    const user = await User.findOne({ where: { email: input.email } });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check active
    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403);
    }

    // Verify password
    const valid = await bcrypt.compare(input.password, user.password_hash);
    if (!valid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = this.generateToken(user.id);

    logger.info(`User logged in: ${user.email}`);

    return { user: user.toSafeJSON(), token };
  }

  // ── Get user by ID ──
  async getUserById(
    userId: string
  ): Promise<Omit<import('../../database/models/user.model').UserAttributes, 'password_hash'>> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403);
    }
    return user.toSafeJSON();
  }

  // ── Generate JWT ──
  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      env.JWT_SECRET as jwt.Secret,
      { expiresIn: env.JWT_EXPIRY as jwt.SignOptions['expiresIn'] }
    );
  }

}

// Single instance used everywhere
export const authService = new AuthService();