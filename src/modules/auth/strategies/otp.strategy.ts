import logger from '../../../shared/utils/logger';

// ── In-memory OTP store ──
// In production, replace this with Redis (config/redis.ts in Phase 3+)
// Structure: phone -> { code, attempts, expiresAt }
interface OTPEntry {
  code: string;
  attempts: number;
  expiresAt: number;
}

const otpStore = new Map<string, OTPEntry>();

// Config
const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 3;

// ── Generate a random numeric OTP ──
function generateCode(length: number): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    code += digits[randomIndex];
  }
  return code;
}

// ── Clean up expired entries periodically ──
setInterval(() => {
  const now = Date.now();
  for (const [phone, entry] of otpStore.entries()) {
    if (now > entry.expiresAt) {
      otpStore.delete(phone);
    }
  }
}, 60 * 1000); // every 60 seconds

// ── Create and store OTP ──
export async function createOTP(phone: string): Promise<{
  success: boolean;
  code: string;
  message: string;
}> {
  try {
    const code = generateCode(OTP_LENGTH);
    const expiresAt = Date.now() + OTP_EXPIRY_MS;

    otpStore.set(phone, {
      code,
      attempts: 0,
      expiresAt,
    });

    // In development, log the OTP for testing
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[DEV OTP] Phone: ${phone} | Code: ${code}`);
    }

    // In production, you would send via SMS here:
    // await smsChannel.sendSMS(phone, `Your EventHub code: ${code}`);

    return {
      success: true,
      code, // only returned so auth.service can use it; never send to client in production
      message: 'OTP generated successfully',
    };
  } catch (error) {
    logger.error('OTP creation failed:', error);
    return {
      success: false,
      code: '',
      message: 'Failed to create OTP',
    };
  }
}

// ── Verify OTP ──
export async function verifyOTP(phone: string, code: string): Promise<{
  valid: boolean;
  message: string;
}> {
  try {
    const entry = otpStore.get(phone);

    // No OTP found
    if (!entry) {
      return {
        valid: false,
        message: 'No OTP found for this phone number. Please request a new one.',
      };
    }

    // Expired
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(phone);
      return {
        valid: false,
        message: 'OTP has expired. Please request a new one.',
      };
    }

    // Too many attempts
    if (entry.attempts >= OTP_MAX_ATTEMPTS) {
      otpStore.delete(phone);
      return {
        valid: false,
        message: 'Too many failed attempts. Please request a new OTP.',
      };
    }

    // Wrong code
    if (entry.code !== code) {
      entry.attempts += 1;
      return {
        valid: false,
        message: `Invalid OTP. ${OTP_MAX_ATTEMPTS - entry.attempts} attempts remaining.`,
      };
    }

    // Correct — delete so it can't be reused
    otpStore.delete(phone);

    return {
      valid: true,
      message: 'OTP verified successfully',
    };
  } catch (error) {
    logger.error('OTP verification failed:', error);
    return {
      valid: false,
      message: 'Verification failed due to an internal error',
    };
  }
}

// ── Check if OTP exists (for rate limiting) ──
export function hasActiveOTP(phone: string): boolean {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  return true;
}