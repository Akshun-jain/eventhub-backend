"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("./auth.middleware");
const rateLimiter_1 = require("../../shared/middleware/rateLimiter");
const auth_validators_1 = require("./auth.validators");
const router = (0, express_1.Router)();
// ── Public routes ──
router.post('/register', rateLimiter_1.authLimiter, auth_validators_1.validateRegister, (req, res, next) => auth_controller_1.authController.register(req, res, next));
router.post('/login', rateLimiter_1.authLimiter, auth_validators_1.validateLogin, (req, res, next) => auth_controller_1.authController.login(req, res, next));
// OTP routes (placeholders — will be wired to auth.controller in Phase 3)
// router.post('/otp/send', otpLimiter, validateSendOTP, ...);
// router.post('/otp/verify', authLimiter, validateVerifyOTP, ...);
// Google route (placeholder — will be wired to auth.controller in Phase 3)
// router.post('/google', authLimiter, validateGoogleSignIn, ...);
// ── Protected routes ──
router.get('/me', auth_middleware_1.authMiddleware, (req, res, next) => auth_controller_1.authController.getMe(req, res, next));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map