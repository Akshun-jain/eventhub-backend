import axios from 'axios';
import { env } from '../../../config/environment';
import { DeviceToken } from '../../../database/models';
import logger from '../../../shared/utils/logger';

export interface PushPayload {
  title: string;
  body: string;
  token?: string;
  topic?: string;
  data?: Record<string, string>;
}

export interface PushResult {
  success: boolean;
  message_id?: string;
  error?: string;
  tokens_sent?: number;
  tokens_failed?: number;
  invalid_tokens?: string[];
}

// ── Send push to a single token ──
async function sendToSingleToken(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; message_id?: string; error?: string }> {
  if (env.NODE_ENV === 'development' || !env.FCM_SERVER_KEY) {
    logger.info(
      `[DEV PUSH] 📱 Token: ${token.substring(0, 20)}... | "${title}"`
    );
    return { success: true, message_id: `dev-push-${Date.now()}` };
  }

  try {
    const response = await axios.post(
      'https://fcm.googleapis.com/fcm/send',
      {
        to: token,
        notification: { title, body },
        data: data || {},
      },
      {
        headers: {
          Authorization: `key=${env.FCM_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    if (response.data?.failure > 0) {
      const errMsg = response.data?.results?.[0]?.error || 'FCM error';
      return { success: false, error: errMsg };
    }

    return {
      success: true,
      message_id: response.data?.results?.[0]?.message_id,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Send push to ALL active device tokens for a user ──
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<PushResult> {
  try {
    // Get all active device tokens for this user
    const tokens = await DeviceToken.findAll({
      where: {
        user_id: userId,
        is_active: true,
      },
    });

    if (tokens.length === 0) {
      logger.info(`No device tokens for user ${userId}, skipping push`);
      return {
        success: true,
        tokens_sent: 0,
        tokens_failed: 0,
        invalid_tokens: [],
      };
    }

    let sentCount = 0;
    let failCount = 0;
    const invalidTokens: string[] = [];
    let lastMessageId: string | undefined;

    for (const deviceToken of tokens) {
      const result = await sendToSingleToken(
        deviceToken.token,
        title,
        body,
        data
      );

      if (result.success) {
        sentCount++;
        lastMessageId = result.message_id;

        // Update last_used_at
        await deviceToken.update({ last_used_at: new Date() });
      } else {
        failCount++;

        // Check for invalid token errors from FCM
        if (
          result.error === 'InvalidRegistration' ||
          result.error === 'NotRegistered' ||
          result.error === 'MismatchSenderId'
        ) {
          invalidTokens.push(deviceToken.token);
          // Deactivate invalid token
          await deviceToken.update({ is_active: false });
          logger.warn(
            `Deactivated invalid device token: ${deviceToken.token.substring(0, 20)}... (${result.error})`
          );
        }
      }
    }

    logger.info(
      `Push to user ${userId}: ${sentCount} sent, ${failCount} failed, ${invalidTokens.length} invalid`
    );

    return {
      success: sentCount > 0,
      message_id: lastMessageId,
      tokens_sent: sentCount,
      tokens_failed: failCount,
      invalid_tokens: invalidTokens,
    };
  } catch (error: any) {
    logger.error(`Push to user ${userId} failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ── Legacy: send to single token or topic (backward compat) ──
export async function sendPushNotification(payload: PushPayload): Promise<PushResult> {
  if (env.NODE_ENV === 'development' || !env.FCM_SERVER_KEY) {
    logger.info(
      `[DEV PUSH] 📱 Title: "${payload.title}" | Body: "${payload.body}" | ` +
      `Token: ${payload.token?.substring(0, 20) || 'none'} | Topic: ${payload.topic || 'none'}`
    );
    return { success: true, message_id: `dev-push-${Date.now()}` };
  }

  try {
    const fcmPayload: any = {
      notification: { title: payload.title, body: payload.body },
      data: payload.data || {},
    };

    if (payload.token) {
      fcmPayload.to = payload.token;
    } else if (payload.topic) {
      fcmPayload.to = `/topics/${payload.topic}`;
    } else {
      return { success: false, error: 'No token or topic provided' };
    }

    const response = await axios.post(
      'https://fcm.googleapis.com/fcm/send',
      fcmPayload,
      {
        headers: {
          Authorization: `key=${env.FCM_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    if (response.data?.failure > 0) {
      const errMsg = response.data?.results?.[0]?.error || 'Unknown FCM error';
      return { success: false, error: errMsg };
    }

    return {
      success: true,
      message_id: response.data?.results?.[0]?.message_id || response.data?.message_id,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function isPushConfigured(): boolean {
  return !!env.FCM_SERVER_KEY;
}