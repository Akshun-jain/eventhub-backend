import axios from 'axios';
import { env } from '../../../config/environment';
import logger from '../../../shared/utils/logger';

export interface SMSPayload {
  to: string;   // E.164 format phone number
  body: string;
}

export interface SMSResult {
  success: boolean;
  sid?: string;
  error?: string;
}

export async function sendSMS(payload: SMSPayload): Promise<SMSResult> {
  try {
    // Development mode — log only
    if (env.NODE_ENV === 'development' || !env.TWILIO_ACCOUNT_SID) {
      logger.info(
        `[DEV SMS] 💬 To: ${payload.to} | Body: "${payload.body}"`
      );
      return { success: true, sid: `dev-sms-${Date.now()}` };
    }

    // Production: Twilio REST API
    const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;

    const params = new URLSearchParams();
    params.append('To', payload.to);
    params.append('From', env.TWILIO_PHONE_NUMBER);
    params.append('Body', payload.body);

    const response = await axios.post(url, params.toString(), {
      auth: {
        username: env.TWILIO_ACCOUNT_SID,
        password: env.TWILIO_AUTH_TOKEN,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 15000,
    });

    logger.info(`SMS sent to ${payload.to}, SID: ${response.data.sid}`);
    return { success: true, sid: response.data.sid };
  } catch (error: any) {
    const errMsg = error.response?.data?.message || error.message;
    logger.error(`SMS to ${payload.to} failed: ${errMsg}`);
    return { success: false, error: errMsg };
  }
}

export function isSMSConfigured(): boolean {
  return !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER);
}