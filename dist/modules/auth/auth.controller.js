"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("./auth.service");
const response_1 = require("../../shared/utils/response");
class AuthController {
    // POST /api/auth/register
    async register(req, res, next) {
        try {
            const { name, email, password, phone } = req.body;
            // ── Validation ──
            if (!name || !email || !password) {
                (0, response_1.sendError)(res, 'name, email, and password are required', 400);
                return;
            }
            if (typeof name !== 'string' || name.trim().length < 2) {
                (0, response_1.sendError)(res, 'Name must be at least 2 characters', 400);
                return;
            }
            if (typeof password !== 'string' || password.length < 8) {
                (0, response_1.sendError)(res, 'Password must be at least 8 characters', 400);
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                (0, response_1.sendError)(res, 'Invalid email format', 400);
                return;
            }
            // ── Create ──
            const result = await auth_service_1.authService.register({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                phone: phone?.trim() || undefined,
            });
            (0, response_1.sendSuccess)(res, result, 'Registration successful', 201);
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/auth/login
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                (0, response_1.sendError)(res, 'email and password are required', 400);
                return;
            }
            const result = await auth_service_1.authService.login({
                email: email.trim().toLowerCase(),
                password,
            });
            (0, response_1.sendSuccess)(res, result, 'Login successful');
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/auth/me  (protected)
    async getMe(req, res, next) {
        try {
            const user = await auth_service_1.authService.getUserById(req.userId);
            (0, response_1.sendSuccess)(res, { user }, 'User retrieved');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map