"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const user_service_1 = require("./user.service");
const response_1 = require("../../shared/utils/response");
class UserController {
    // GET /api/users/profile
    async getProfile(req, res, next) {
        try {
            const user = await user_service_1.userService.getProfile(req.userId);
            (0, response_1.sendSuccess)(res, { user }, 'Profile retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // PUT /api/users/profile
    async updateProfile(req, res, next) {
        try {
            const { name, email, phone, timezone } = req.body;
            // At least one field required
            if (!name && !email && !phone && !timezone) {
                (0, response_1.sendError)(res, 'At least one field is required to update', 400);
                return;
            }
            // Validate fields if provided
            if (name !== undefined) {
                if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
                    (0, response_1.sendError)(res, 'Name must be 2-100 characters', 400);
                    return;
                }
            }
            if (email !== undefined) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
                    (0, response_1.sendError)(res, 'Invalid email format', 400);
                    return;
                }
            }
            if (phone !== undefined) {
                const phoneRegex = /^\+[1-9]\d{1,14}$/;
                if (typeof phone !== 'string' || !phoneRegex.test(phone.trim())) {
                    (0, response_1.sendError)(res, 'Phone must be in E.164 format (+1234567890)', 400);
                    return;
                }
            }
            if (timezone !== undefined) {
                if (typeof timezone !== 'string' || timezone.trim().length > 50) {
                    (0, response_1.sendError)(res, 'Timezone must be a string under 50 characters', 400);
                    return;
                }
            }
            const user = await user_service_1.userService.updateProfile(req.userId, {
                name,
                email,
                phone,
                timezone,
            });
            (0, response_1.sendSuccess)(res, { user }, 'Profile updated');
        }
        catch (error) {
            next(error);
        }
    }
    // DELETE /api/users/account
    async deleteAccount(req, res, next) {
        try {
            await user_service_1.userService.deactivateAccount(req.userId);
            (0, response_1.sendSuccess)(res, null, 'Account deactivated');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.userController = new UserController();
//# sourceMappingURL=user.controller.js.map