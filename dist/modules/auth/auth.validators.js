"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRefreshToken = exports.validateCompleteProfile = exports.validateGoogleSignIn = exports.validateVerifyOTP = exports.validateSendOTP = exports.validateLogin = exports.validateRegister = void 0;
const response_1 = require("../../shared/utils/response");
// ── Register validation ──
const validateRegister = (req, res, next) => {
    const { name, email, password, phone } = req.body;
    const errors = [];
    // name
    if (!name || typeof name !== 'string') {
        errors.push('Name is required');
    }
    else if (name.trim().length < 2 || name.trim().length > 100) {
        errors.push('Name must be 2-100 characters');
    }
    // email
    if (!email || typeof email !== 'string') {
        errors.push('Email is required');
    }
    else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            errors.push('Invalid email format');
        }
    }
    // password
    if (!password || typeof password !== 'string') {
        errors.push('Password is required');
    }
    else {
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }
        if (password.length > 128) {
            errors.push('Password must be at most 128 characters');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
    }
    // phone (optional)
    if (phone !== undefined && phone !== null && phone !== '') {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (typeof phone !== 'string' || !phoneRegex.test(phone.trim())) {
            errors.push('Phone must be in E.164 format (e.g. +1234567890)');
        }
    }
    if (errors.length > 0) {
        (0, response_1.sendError)(res, errors.join('; '), 400);
        return;
    }
    next();
};
exports.validateRegister = validateRegister;
// ── Login validation ──
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];
    if (!email || typeof email !== 'string') {
        errors.push('Email is required');
    }
    else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            errors.push('Invalid email format');
        }
    }
    if (!password || typeof password !== 'string') {
        errors.push('Password is required');
    }
    if (errors.length > 0) {
        (0, response_1.sendError)(res, errors.join('; '), 400);
        return;
    }
    next();
};
exports.validateLogin = validateLogin;
// ── Send OTP validation ──
const validateSendOTP = (req, res, next) => {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string') {
        (0, response_1.sendError)(res, 'Phone number is required', 400);
        return;
    }
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone.trim())) {
        (0, response_1.sendError)(res, 'Phone must be in E.164 format (e.g. +1234567890)', 400);
        return;
    }
    next();
};
exports.validateSendOTP = validateSendOTP;
// ── Verify OTP validation ──
const validateVerifyOTP = (req, res, next) => {
    const { phone, code } = req.body;
    const errors = [];
    if (!phone || typeof phone !== 'string') {
        errors.push('Phone number is required');
    }
    else {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phone.trim())) {
            errors.push('Phone must be in E.164 format');
        }
    }
    if (!code || typeof code !== 'string') {
        errors.push('OTP code is required');
    }
    else if (!/^\d{6}$/.test(code.trim())) {
        errors.push('OTP must be exactly 6 digits');
    }
    if (errors.length > 0) {
        (0, response_1.sendError)(res, errors.join('; '), 400);
        return;
    }
    next();
};
exports.validateVerifyOTP = validateVerifyOTP;
// ── Google sign-in validation ──
const validateGoogleSignIn = (req, res, next) => {
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== 'string' || idToken.trim() === '') {
        (0, response_1.sendError)(res, 'Google ID token is required', 400);
        return;
    }
    next();
};
exports.validateGoogleSignIn = validateGoogleSignIn;
// ── Complete profile validation ──
const validateCompleteProfile = (req, res, next) => {
    const { name, email, phone, timezone } = req.body;
    const errors = [];
    if (!name || typeof name !== 'string') {
        errors.push('Name is required');
    }
    else if (name.trim().length < 2 || name.trim().length > 100) {
        errors.push('Name must be 2-100 characters');
    }
    if (email !== undefined && email !== null && email !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
            errors.push('Invalid email format');
        }
    }
    if (phone !== undefined && phone !== null && phone !== '') {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (typeof phone !== 'string' || !phoneRegex.test(phone.trim())) {
            errors.push('Phone must be in E.164 format');
        }
    }
    if (timezone !== undefined && timezone !== null && timezone !== '') {
        if (typeof timezone !== 'string' || timezone.trim().length > 50) {
            errors.push('Timezone must be a string under 50 characters');
        }
    }
    if (errors.length > 0) {
        (0, response_1.sendError)(res, errors.join('; '), 400);
        return;
    }
    next();
};
exports.validateCompleteProfile = validateCompleteProfile;
// ── Refresh token validation ──
const validateRefreshToken = (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
        (0, response_1.sendError)(res, 'Refresh token is required', 400);
        return;
    }
    next();
};
exports.validateRefreshToken = validateRefreshToken;
//# sourceMappingURL=auth.validators.js.map