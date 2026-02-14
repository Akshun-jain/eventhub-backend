"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushToUser = sendPushToUser;
exports.sendPushNotification = sendPushNotification;
exports.isPushConfigured = isPushConfigured;
const axios_1 = __importDefault(require("axios"));
const environment_1 = require("../../../config/environment");
const models_1 = require("../../../database/models");
const logger_1 = __importDefault(require("../../../shared/utils/logger"));
// ── Send push to a single token ──
async function sendToSingleToken(token, title, body, data) {
    if (environment_1.env.NODE_ENV === 'development' || !environment_1.env.FCM_SERVER_KEY) {
        logger_1.default.info(`[DEV PUSH] 📱 Token: ${token.substring(0, 20)}... | "${title}"`);
        return { success: true, message_id: `dev-push-${Date.now()}` };
    }
    try {
        const response = await axios_1.default.post('https://fcm.googleapis.com/fcm/send', {
            to: token,
            notification: { title, body },
            data: data || {},
        }, {
            headers: {
                Authorization: `key=${environment_1.env.FCM_SERVER_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });
        if (response.data?.failure > 0) {
            const errMsg = response.data?.results?.[0]?.error || 'FCM error';
            return { success: false, error: errMsg };
        }
        return {
            success: true,
            message_id: response.data?.results?.[0]?.message_id,
        };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}
// ── Send push to ALL active device tokens for a user ──
async function sendPushToUser(userId, title, body, data) {
    try {
        // Get all active device tokens for this user
        const tokens = await models_1.DeviceToken.findAll({
            where: {
                user_id: userId,
                is_active: true,
            },
        });
        if (tokens.length === 0) {
            logger_1.default.info(`No device tokens for user ${userId}, skipping push`);
            return {
                success: true,
                tokens_sent: 0,
                tokens_failed: 0,
                invalid_tokens: [],
            };
        }
        let sentCount = 0;
        let failCount = 0;
        const invalidTokens = [];
        let lastMessageId;
        for (const deviceToken of tokens) {
            const result = await sendToSingleToken(deviceToken.token, title, body, data);
            if (result.success) {
                sentCount++;
                lastMessageId = result.message_id;
                // Update last_used_at
                await deviceToken.update({ last_used_at: new Date() });
            }
            else {
                failCount++;
                // Check for invalid token errors from FCM
                if (result.error === 'InvalidRegistration' ||
                    result.error === 'NotRegistered' ||
                    result.error === 'MismatchSenderId') {
                    invalidTokens.push(deviceToken.token);
                    // Deactivate invalid token
                    await deviceToken.update({ is_active: false });
                    logger_1.default.warn(`Deactivated invalid device token: ${deviceToken.token.substring(0, 20)}... (${result.error})`);
                }
            }
        }
        logger_1.default.info(`Push to user ${userId}: ${sentCount} sent, ${failCount} failed, ${invalidTokens.length} invalid`);
        return {
            success: sentCount > 0,
            message_id: lastMessageId,
            tokens_sent: sentCount,
            tokens_failed: failCount,
            invalid_tokens: invalidTokens,
        };
    }
    catch (error) {
        logger_1.default.error(`Push to user ${userId} failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}
// ── Legacy: send to single token or topic (backward compat) ──
async function sendPushNotification(payload) {
    if (environment_1.env.NODE_ENV === 'development' || !environment_1.env.FCM_SERVER_KEY) {
        logger_1.default.info(`[DEV PUSH] 📱 Title: "${payload.title}" | Body: "${payload.body}" | ` +
            `Token: ${payload.token?.substring(0, 20) || 'none'} | Topic: ${payload.topic || 'none'}`);
        return { success: true, message_id: `dev-push-${Date.now()}` };
    }
    try {
        const fcmPayload = {
            notification: { title: payload.title, body: payload.body },
            data: payload.data || {},
        };
        if (payload.token) {
            fcmPayload.to = payload.token;
        }
        else if (payload.topic) {
            fcmPayload.to = `/topics/${payload.topic}`;
        }
        else {
            return { success: false, error: 'No token or topic provided' };
        }
        const response = await axios_1.default.post('https://fcm.googleapis.com/fcm/send', fcmPayload, {
            headers: {
                Authorization: `key=${environment_1.env.FCM_SERVER_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });
        if (response.data?.failure > 0) {
            const errMsg = response.data?.results?.[0]?.error || 'Unknown FCM error';
            return { success: false, error: errMsg };
        }
        return {
            success: true,
            message_id: response.data?.results?.[0]?.message_id || response.data?.message_id,
        };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}
function isPushConfigured() {
    return !!environment_1.env.FCM_SERVER_KEY;
}
//# sourceMappingURL=push.channel.js.map