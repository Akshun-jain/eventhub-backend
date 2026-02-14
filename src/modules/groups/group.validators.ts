import { Request, Response, NextFunction } from 'express';
import { sendError } from '../../shared/utils/response';

type ValidatorFn = (req: Request, res: Response, next: NextFunction) => void;

const VALID_GROUP_TYPES = ['family', 'office', 'school', 'college', 'community', 'custom'];

// ── Create group ──
export const validateCreateGroup: ValidatorFn = (req, res, next) => {
  const { name, description, type, is_private, require_approval, max_members } = req.body;
  const errors: string[] = [];

  if (!name || typeof name !== 'string') {
    errors.push('Group name is required');
  } else if (name.trim().length < 2 || name.trim().length > 100) {
    errors.push('Group name must be 2-100 characters');
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string' || description.length > 500) {
      errors.push('Description must be a string under 500 characters');
    }
  }

  if (type !== undefined) {
    if (!VALID_GROUP_TYPES.includes(type)) {
      errors.push(`Type must be one of: ${VALID_GROUP_TYPES.join(', ')}`);
    }
  }

  if (is_private !== undefined && typeof is_private !== 'boolean') {
    errors.push('is_private must be a boolean');
  }

  if (require_approval !== undefined && typeof require_approval !== 'boolean') {
    errors.push('require_approval must be a boolean');
  }

  if (max_members !== undefined) {
    if (typeof max_members !== 'number' || !Number.isInteger(max_members) || max_members < 2 || max_members > 1000) {
      errors.push('max_members must be an integer between 2 and 1000');
    }
  }

  if (errors.length > 0) {
    sendError(res, errors.join('; '), 400);
    return;
  }

  next();
};

// ── Update group ──
export const validateUpdateGroup: ValidatorFn = (req, res, next) => {
  const { name, description, type, is_private, require_approval } = req.body;
  const errors: string[] = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      errors.push('Group name must be 2-100 characters');
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string' || description.length > 500) {
      errors.push('Description must be under 500 characters');
    }
  }

  if (type !== undefined) {
    if (!VALID_GROUP_TYPES.includes(type)) {
      errors.push(`Type must be one of: ${VALID_GROUP_TYPES.join(', ')}`);
    }
  }

  if (is_private !== undefined && typeof is_private !== 'boolean') {
    errors.push('is_private must be a boolean');
  }

  if (require_approval !== undefined && typeof require_approval !== 'boolean') {
    errors.push('require_approval must be a boolean');
  }

  if (errors.length > 0) {
    sendError(res, errors.join('; '), 400);
    return;
  }

  next();
};

// ── Validate groupId param ──
export const validateGroupId: ValidatorFn = (req, res, next) => {
  const { groupId } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!groupId || !uuidRegex.test(groupId)) {
    sendError(res, 'Invalid group ID', 400);
    return;
  }

  next();
};

// ── Validate invite code param ──
export const validateInviteCode: ValidatorFn = (req, res, next) => {
  const { inviteCode } = req.params;

  if (!inviteCode || typeof inviteCode !== 'string' || inviteCode.trim().length < 6 || inviteCode.trim().length > 20) {
    sendError(res, 'Invalid invite code', 400);
    return;
  }

  next();
};

// ── Validate invite member body ──
export const validateInviteMember: ValidatorFn = (req, res, next) => {
  const { phone, email, role } = req.body;
  const errors: string[] = [];

  // At least one contact method
  if (!phone && !email) {
    errors.push('Either phone or email is required');
  }

  if (phone !== undefined && phone !== null && phone !== '') {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (typeof phone !== 'string' || !phoneRegex.test(phone.trim())) {
      errors.push('Phone must be in E.164 format');
    }
  }

  if (email !== undefined && email !== null && email !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
      errors.push('Invalid email format');
    }
  }

  if (role !== undefined) {
    if (!['admin', 'member'].includes(role)) {
      errors.push('Role must be admin or member');
    }
  }

  if (errors.length > 0) {
    sendError(res, errors.join('; '), 400);
    return;
  }

  next();
};

// ── Validate memberId param ──
export const validateMemberId: ValidatorFn = (req, res, next) => {
  const { memberId } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!memberId || !uuidRegex.test(memberId)) {
    sendError(res, 'Invalid member ID', 400);
    return;
  }

  next();
};

// ── Validate update member role ──
export const validateUpdateMemberRole: ValidatorFn = (req, res, next) => {
  const { role } = req.body;

  if (!role || !['admin', 'member'].includes(role)) {
    sendError(res, 'Role must be admin or member', 400);
    return;
  }

  next();
};

// ── Validate notification prefs ──
export const validateNotificationPrefs: ValidatorFn = (req, res, next) => {
  const { push, sms, whatsapp, email } = req.body;
  const errors: string[] = [];

  if (push !== undefined && typeof push !== 'boolean') {
    errors.push('push must be a boolean');
  }
  if (sms !== undefined && typeof sms !== 'boolean') {
    errors.push('sms must be a boolean');
  }
  if (whatsapp !== undefined && typeof whatsapp !== 'boolean') {
    errors.push('whatsapp must be a boolean');
  }
  if (email !== undefined && typeof email !== 'boolean') {
    errors.push('email must be a boolean');
  }

  if (errors.length > 0) {
    sendError(res, errors.join('; '), 400);
    return;
  }

  next();
};