import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from './auth.middleware';
import { authLimiter, otpLimiter } from '../../shared/middleware/rateLimiter';
import {
  validateRegister,
  validateLogin,
  validateSendOTP,
  validateVerifyOTP,
  validateGoogleSignIn,
  validateCompleteProfile,
} from './auth.validators';

const router = Router();

// ── Public routes ──
router.post('/register', authLimiter, validateRegister, (req, res, next) =>
  authController.register(req, res, next)
);

router.post('/login', authLimiter, validateLogin, (req, res, next) =>
  authController.login(req, res, next)
);

// OTP routes (placeholders — will be wired to auth.controller in Phase 3)
// router.post('/otp/send', otpLimiter, validateSendOTP, ...);
// router.post('/otp/verify', authLimiter, validateVerifyOTP, ...);

// Google route (placeholder — will be wired to auth.controller in Phase 3)
// router.post('/google', authLimiter, validateGoogleSignIn, ...);

// ── Protected routes ──
router.get('/me', authMiddleware, (req, res, next) =>
  authController.getMe(req, res, next)
);

export default router;