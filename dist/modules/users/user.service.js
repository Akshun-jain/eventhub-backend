"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const models_1 = require("../../database/models");
const errorHandler_1 = require("../../shared/middleware/errorHandler");
const logger_1 = __importDefault(require("../../shared/utils/logger"));
class UserService {
    // ── Get profile ──
    async getProfile(userId) {
        const user = await models_1.User.findByPk(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        if (!user.is_active) {
            throw new errorHandler_1.AppError('Account is deactivated', 403);
        }
        return user.toSafeJSON();
    }
    // ── Update profile ──
    async updateProfile(userId, input) {
        const user = await models_1.User.findByPk(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        if (!user.is_active) {
            throw new errorHandler_1.AppError('Account is deactivated', 403);
        }
        // Check email uniqueness if changing
        if (input.email && input.email !== user.email) {
            const existing = await models_1.User.findOne({ where: { email: input.email } });
            if (existing) {
                throw new errorHandler_1.AppError('Email already in use', 409);
            }
        }
        // Check phone uniqueness if changing
        if (input.phone && input.phone !== user.phone) {
            const existing = await models_1.User.findOne({ where: { phone: input.phone } });
            if (existing) {
                throw new errorHandler_1.AppError('Phone number already in use', 409);
            }
        }
        // Build update object — only include provided fields
        const updateData = {};
        if (input.name !== undefined)
            updateData.name = input.name.trim();
        if (input.email !== undefined)
            updateData.email = input.email.trim().toLowerCase();
        if (input.phone !== undefined)
            updateData.phone = input.phone.trim();
        if (input.timezone !== undefined)
            updateData.timezone = input.timezone.trim();
        await user.update(updateData);
        logger_1.default.info(`User profile updated: ${userId}`);
        return user.toSafeJSON();
    }
    // ── Deactivate account ──
    async deactivateAccount(userId) {
        const user = await models_1.User.findByPk(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        await user.update({ is_active: false });
        logger_1.default.info(`User account deactivated: ${userId}`);
    }
}
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map