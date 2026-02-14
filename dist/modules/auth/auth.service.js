"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const models_1 = require("../../database/models");
const environment_1 = require("../../config/environment");
const errorHandler_1 = require("../../shared/middleware/errorHandler");
const logger_1 = __importDefault(require("../../shared/utils/logger"));
const SALT_ROUNDS = 12;
class AuthService {
    // ── Register ──
    async register(input) {
        // Check duplicate email
        const existing = await models_1.User.findOne({ where: { email: input.email } });
        if (existing) {
            throw new errorHandler_1.AppError('Email already registered', 409);
        }
        // Check duplicate phone if provided
        if (input.phone) {
            const phoneExists = await models_1.User.findOne({ where: { phone: input.phone } });
            if (phoneExists) {
                throw new errorHandler_1.AppError('Phone number already registered', 409);
            }
        }
        // Hash password
        const password_hash = await bcryptjs_1.default.hash(input.password, SALT_ROUNDS);
        // Create user
        const user = await models_1.User.create({
            name: input.name,
            email: input.email,
            password_hash,
            phone: input.phone || null,
        });
        const token = this.generateToken(user.id);
        logger_1.default.info(`User registered: ${user.email} (${user.id})`);
        return { user: user.toSafeJSON(), token };
    }
    // ── Login ──
    async login(input) {
        // Find user by email
        const user = await models_1.User.findOne({ where: { email: input.email } });
        if (!user) {
            throw new errorHandler_1.AppError('Invalid email or password', 401);
        }
        // Check active
        if (!user.is_active) {
            throw new errorHandler_1.AppError('Account is deactivated', 403);
        }
        // Verify password
        const valid = await bcryptjs_1.default.compare(input.password, user.password_hash);
        if (!valid) {
            throw new errorHandler_1.AppError('Invalid email or password', 401);
        }
        const token = this.generateToken(user.id);
        logger_1.default.info(`User logged in: ${user.email}`);
        return { user: user.toSafeJSON(), token };
    }
    // ── Get user by ID ──
    async getUserById(userId) {
        const user = await models_1.User.findByPk(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        if (!user.is_active) {
            throw new errorHandler_1.AppError('Account is deactivated', 403);
        }
        return user.toSafeJSON();
    }
    // ── Generate JWT ──
    generateToken(userId) {
        return jwt.sign({ userId }, environment_1.env.JWT_SECRET, { expiresIn: environment_1.env.JWT_EXPIRY });
    }
}
// Single instance used everywhere
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map