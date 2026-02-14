// ── Reusable validation functions ──
// Used by validators, services, and controllers across the app

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const regex = /^\+[1-9]\d{1,14}$/;
  return regex.test(phone.trim());
}

export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

export function isValidDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export function isValidTime(timeStr: string): boolean {
  if (!timeStr || typeof timeStr !== 'string') return false;
  const regex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  return regex.test(timeStr);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isStringInRange(
  value: unknown,
  min: number,
  max: number
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length >= min &&
    value.trim().length <= max
  );
}

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export interface PasswordStrengthResult {
  valid: boolean;
  errors: string[];
}

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const errors: string[] = [];

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

export function isValidInviteCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  // Alphanumeric, 6-20 characters
  const regex = /^[A-Z0-9]{6,20}$/;
  return regex.test(code.trim());
}

export function isPositiveInteger(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return !isNaN(parsed) && parsed > 0 && String(parsed) === value;
  }
  return false;
}