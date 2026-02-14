"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEventQuery = exports.validateRSVP = exports.validateUpdateEvent = exports.validateCreateEvent = exports.validateEventId = exports.validateGroupId = void 0;
const response_1 = require("../../shared/utils/response");
const VALID_EVENT_TYPES = ['birthday', 'anniversary', 'meeting', 'deadline', 'custom'];
const VALID_RECURRENCE = ['none', 'yearly', 'monthly', 'weekly'];
const VALID_RSVP_STATUS = ['going', 'not_going', 'maybe'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
// ── Helper: validate a date string is real ──
function isRealDate(dateStr) {
    if (!DATE_REGEX.test(dateStr))
        return false;
    const date = new Date(dateStr + 'T00:00:00Z');
    if (isNaN(date.getTime()))
        return false;
    // Check it didn't roll over (e.g. Feb 31 → Mar 3)
    const parts = dateStr.split('-');
    return (date.getUTCFullYear() === parseInt(parts[0], 10) &&
        date.getUTCMonth() + 1 === parseInt(parts[1], 10) &&
        date.getUTCDate() === parseInt(parts[2], 10));
}
// ── Validate groupId param ──
const validateGroupId = (req, res, next) => {
    const { groupId } = req.params;
    if (!groupId || !UUID_REGEX.test(groupId)) {
        (0, response_1.sendError)(res, 'Invalid group ID', 400);
        return;
    }
    next();
};
exports.validateGroupId = validateGroupId;
// ── Validate eventId param ──
const validateEventId = (req, res, next) => {
    const { eventId } = req.params;
    if (!eventId || !UUID_REGEX.test(eventId)) {
        (0, response_1.sendError)(res, 'Invalid event ID', 400);
        return;
    }
    next();
};
exports.validateEventId = validateEventId;
// ── Create event ──
const validateCreateEvent = (req, res, next) => {
    const { title, person_name, event_type, custom_type_name, event_date, event_time, recurrence, notes, remind_on_day, remind_days_before, } = req.body;
    const errors = [];
    // title
    if (!title || typeof title !== 'string') {
        errors.push('Title is required');
    }
    else if (title.trim().length < 1 || title.trim().length > 200) {
        errors.push('Title must be 1-200 characters');
    }
    // person_name
    if (!person_name || typeof person_name !== 'string') {
        errors.push('Person name is required');
    }
    else if (person_name.trim().length < 1 || person_name.trim().length > 100) {
        errors.push('Person name must be 1-100 characters');
    }
    // event_type
    if (!event_type || !VALID_EVENT_TYPES.includes(event_type)) {
        errors.push(`Event type must be one of: ${VALID_EVENT_TYPES.join(', ')}`);
    }
    // custom_type_name — required when event_type is 'custom'
    if (event_type === 'custom') {
        if (!custom_type_name || typeof custom_type_name !== 'string' || custom_type_name.trim().length === 0) {
            errors.push('Custom type name is required when event_type is custom');
        }
        else if (custom_type_name.trim().length > 50) {
            errors.push('Custom type name must be under 50 characters');
        }
    }
    // event_date
    if (!event_date || typeof event_date !== 'string') {
        errors.push('Event date is required (YYYY-MM-DD)');
    }
    else if (!isRealDate(event_date)) {
        errors.push('Event date must be a valid date in YYYY-MM-DD format');
    }
    // event_time (optional)
    if (event_time !== undefined && event_time !== null && event_time !== '') {
        if (typeof event_time !== 'string' || !TIME_REGEX.test(event_time)) {
            errors.push('Event time must be in HH:mm or HH:mm:ss format');
        }
    }
    // recurrence (optional, defaults in service)
    if (recurrence !== undefined) {
        if (!VALID_RECURRENCE.includes(recurrence)) {
            errors.push(`Recurrence must be one of: ${VALID_RECURRENCE.join(', ')}`);
        }
    }
    // notes (optional)
    if (notes !== undefined && notes !== null) {
        if (typeof notes !== 'string' || notes.length > 2000) {
            errors.push('Notes must be a string under 2000 characters');
        }
    }
    // remind_on_day (optional)
    if (remind_on_day !== undefined && typeof remind_on_day !== 'boolean') {
        errors.push('remind_on_day must be a boolean');
    }
    // remind_days_before (optional)
    if (remind_days_before !== undefined) {
        if (!Array.isArray(remind_days_before)) {
            errors.push('remind_days_before must be an array of integers');
        }
        else {
            for (let i = 0; i < remind_days_before.length; i++) {
                const val = remind_days_before[i];
                if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 30) {
                    errors.push(`remind_days_before[${i}] must be an integer between 1 and 30`);
                    break;
                }
            }
            if (remind_days_before.length > 5) {
                errors.push('remind_days_before can have at most 5 entries');
            }
        }
    }
    if (errors.length > 0) {
        (0, response_1.sendError)(res, errors.join('; '), 400);
        return;
    }
    next();
};
exports.validateCreateEvent = validateCreateEvent;
// ── Update event ──
const validateUpdateEvent = (req, res, next) => {
    const { title, person_name, event_type, custom_type_name, event_date, event_time, recurrence, notes, remind_on_day, remind_days_before, is_active, } = req.body;
    const errors = [];
    // At least one field
    const hasAnyField = title !== undefined ||
        person_name !== undefined ||
        event_type !== undefined ||
        custom_type_name !== undefined ||
        event_date !== undefined ||
        event_time !== undefined ||
        recurrence !== undefined ||
        notes !== undefined ||
        remind_on_day !== undefined ||
        remind_days_before !== undefined ||
        is_active !== undefined;
    if (!hasAnyField) {
        (0, response_1.sendError)(res, 'At least one field is required to update', 400);
        return;
    }
    if (title !== undefined) {
        if (typeof title !== 'string' || title.trim().length < 1 || title.trim().length > 200) {
            errors.push('Title must be 1-200 characters');
        }
    }
    if (person_name !== undefined) {
        if (typeof person_name !== 'string' || person_name.trim().length < 1 || person_name.trim().length > 100) {
            errors.push('Person name must be 1-100 characters');
        }
    }
    if (event_type !== undefined) {
        if (!VALID_EVENT_TYPES.includes(event_type)) {
            errors.push(`Event type must be one of: ${VALID_EVENT_TYPES.join(', ')}`);
        }
    }
    if (custom_type_name !== undefined && custom_type_name !== null) {
        if (typeof custom_type_name !== 'string' || custom_type_name.trim().length > 50) {
            errors.push('Custom type name must be under 50 characters');
        }
    }
    if (event_date !== undefined) {
        if (typeof event_date !== 'string' || !isRealDate(event_date)) {
            errors.push('Event date must be a valid date in YYYY-MM-DD format');
        }
    }
    if (event_time !== undefined && event_time !== null) {
        if (typeof event_time !== 'string' || !TIME_REGEX.test(event_time)) {
            errors.push('Event time must be in HH:mm or HH:mm:ss format');
        }
    }
    if (recurrence !== undefined) {
        if (!VALID_RECURRENCE.includes(recurrence)) {
            errors.push(`Recurrence must be one of: ${VALID_RECURRENCE.join(', ')}`);
        }
    }
    if (notes !== undefined && notes !== null) {
        if (typeof notes !== 'string' || notes.length > 2000) {
            errors.push('Notes must be under 2000 characters');
        }
    }
    if (remind_on_day !== undefined && typeof remind_on_day !== 'boolean') {
        errors.push('remind_on_day must be a boolean');
    }
    if (remind_days_before !== undefined) {
        if (!Array.isArray(remind_days_before)) {
            errors.push('remind_days_before must be an array');
        }
        else {
            for (let i = 0; i < remind_days_before.length; i++) {
                const val = remind_days_before[i];
                if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 30) {
                    errors.push(`remind_days_before[${i}] must be an integer between 1 and 30`);
                    break;
                }
            }
        }
    }
    if (is_active !== undefined && typeof is_active !== 'boolean') {
        errors.push('is_active must be a boolean');
    }
    if (errors.length > 0) {
        (0, response_1.sendError)(res, errors.join('; '), 400);
        return;
    }
    next();
};
exports.validateUpdateEvent = validateUpdateEvent;
// ── RSVP respond ──
const validateRSVP = (req, res, next) => {
    const { status, note } = req.body;
    const errors = [];
    if (!status || !VALID_RSVP_STATUS.includes(status)) {
        errors.push(`Status must be one of: ${VALID_RSVP_STATUS.join(', ')}`);
    }
    if (note !== undefined && note !== null) {
        if (typeof note !== 'string' || note.length > 500) {
            errors.push('Note must be a string under 500 characters');
        }
    }
    if (errors.length > 0) {
        (0, response_1.sendError)(res, errors.join('; '), 400);
        return;
    }
    next();
};
exports.validateRSVP = validateRSVP;
// ── Query params for listing ──
const validateEventQuery = (req, res, next) => {
    const { page, limit, type, recurrence: rec } = req.query;
    const errors = [];
    if (page !== undefined) {
        const p = parseInt(page, 10);
        if (isNaN(p) || p < 1) {
            errors.push('page must be a positive integer');
        }
    }
    if (limit !== undefined) {
        const l = parseInt(limit, 10);
        if (isNaN(l) || l < 1 || l > 100) {
            errors.push('limit must be 1-100');
        }
    }
    if (type !== undefined) {
        if (!VALID_EVENT_TYPES.includes(type)) {
            errors.push(`type filter must be one of: ${VALID_EVENT_TYPES.join(', ')}`);
        }
    }
    if (rec !== undefined) {
        if (!VALID_RECURRENCE.includes(rec)) {
            errors.push(`recurrence filter must be one of: ${VALID_RECURRENCE.join(', ')}`);
        }
    }
    if (req.query.search && req.query.search.length > 100) {
        errors.push('search must be under 100 characters');
    }
    if (errors.length > 0) {
        (0, response_1.sendError)(res, errors.join('; '), 400);
        return;
    }
    next();
};
exports.validateEventQuery = validateEventQuery;
//# sourceMappingURL=event.validators.js.map