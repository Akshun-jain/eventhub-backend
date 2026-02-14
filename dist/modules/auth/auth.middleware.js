"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const response_1 = require("../../shared/utils/response");
const environment_1 = require("../../config/environment");
const models_1 = require("../../database/models");
async function authMiddleware(req, res, next) {
    try {
        // 1. Extract token
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            (0, response_1.sendError)(res, 'No token provided', 401);
            return;
        }
        const token = header.split('Bearer ')[1];
        if (!token || token.trim() === '') {
            (0, response_1.sendError)(res, 'No token provided', 401);
            return;
        }
        // 2. Verify token
        const decoded = jsonwebtoken_1.default.verify(token, environment_1.env.JWT_SECRET);
        // 3. Load user from DB
        const user = await models_1.User.findByPk(decoded.userId);
        if (!user || !user.is_active) {
            (0, response_1.sendError)(res, 'User not found or inactive', 401);
            return;
        }
        // 4. Attach to request
        req.userId = user.id;
        req.user = user.toJSON();
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            (0, response_1.sendError)(res, 'Token expired', 401);
            return;
        }
        if (error.name === 'JsonWebTokenError') {
            (0, response_1.sendError)(res, 'Invalid token', 401);
            return;
        }
        (0, response_1.sendError)(res, 'Authentication failed', 401);
    }
}
//# sourceMappingURL=auth.middleware.js.map