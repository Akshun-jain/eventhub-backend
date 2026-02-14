"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSMS = sendSMS;
exports.isSMSConfigured = isSMSConfigured;
const axios_1 = __importDefault(require("axios"));
const environment_1 = require("../../../config/environment");
const logger_1 = __importDefault(require("../../../shared/utils/logger"));
async function sendSMS(payload) {
    try {
        // Development mode — log only
        if (environment_1.env.NODE_ENV === 'development' || !environment_1.env.TWILIO_ACCOUNT_SID) {
            logger_1.default.info(`[DEV SMS] 💬 To: ${payload.to} | Body: "${payload.body}"`);
            return { success: true, sid: `dev-sms-${Date.now()}` };
        }
        // Production: Twilio REST API
        const url = `https://api.twilio.com/2010-04-01/Accounts/${environment_1.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const params = new URLSearchParams();
        params.append('To', payload.to);
        params.append('From', environment_1.env.TWILIO_PHONE_NUMBER);
        params.append('Body', payload.body);
        const response = await axios_1.default.post(url, params.toString(), {
            auth: {
                username: environment_1.env.TWILIO_ACCOUNT_SID,
                password: environment_1.env.TWILIO_AUTH_TOKEN,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 15000,
        });
        logger_1.default.info(`SMS sent to ${payload.to}, SID: ${response.data.sid}`);
        return { success: true, sid: response.data.sid };
    }
    catch (error) {
        const errMsg = error.response?.data?.message || error.message;
        logger_1.default.error(`SMS to ${payload.to} failed: ${errMsg}`);
        return { success: false, error: errMsg };
    }
}
function isSMSConfigured() {
    return !!(environment_1.env.TWILIO_ACCOUNT_SID && environment_1.env.TWILIO_AUTH_TOKEN && environment_1.env.TWILIO_PHONE_NUMBER);
}
//# sourceMappingURL=sms.channel.js.map