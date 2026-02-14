"use strict";
// ── Reusable validation functions ──
// Used by validators, services, and controllers across the app
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = isValidEmail;
exports.isValidPhone = isValidPhone;
exports.isValidUUID = isValidUUID;
exports.isValidDate = isValidDate;
exports.isValidTime = isValidTime;
exports.isNonEmptyString = isNonEmptyString;
exports.isStringInRange = isStringInRange;
exports.sanitizeString = sanitizeString;
exports.checkPasswordStrength = checkPasswordStrength;
exports.isValidInviteCode = isValidInviteCode;
exports.isPositiveInteger = isPositiveInteger;
function isValidEmail(email) {
    if (!email || typeof email !== 'string')
        return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
}
function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string')
        return false;
    const regex = /^\+[1-9]\d{1,14}$/;
    return regex.test(phone.trim());
}
function isValidUUID(uuid) {
    if (!uuid || typeof uuid !== 'string')
        return false;
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}
function isValidDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string')
        return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}
function isValidTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string')
        return false;
    const regex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    return regex.test(timeStr);
}
function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
function isStringInRange(value, min, max) {
    return (typeof value === 'string' &&
        value.trim().length >= min &&
        value.trim().length <= max);
}
function sanitizeString(input) {
    return input
        .trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
function checkPasswordStrength(password) {
    const errors = [];
    if (!password || typeof password !== 'string') {
        return { valid: false, errors: ['Password is required'] };
    }
    if (password.length < 8) {
        errors.push('At least 8 characters required');
    }
    if (password.length > 128) {
        errors.push('Must be at most 128 characters');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('At least one uppercase letter required');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('At least one lowercase letter required');
    }
    if (!/\d/.test(password)) {
        errors.push('At least one number required');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
function isValidInviteCode(code) {
    if (!code || typeof code !== 'string')
        return false;
    // Alphanumeric, 6-20 characters
    const regex = /^[A-Z0-9]{6,20}$/;
    return regex.test(code.trim());
}
function isPositiveInteger(value) {
    if (typeof value === 'number') {
        return Number.isInteger(value) && value > 0;
    }
    if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return !isNaN(parsed) && parsed > 0 && String(parsed) === value;
    }
    return false;
}
//# sourceMappingURL=validators.js.map