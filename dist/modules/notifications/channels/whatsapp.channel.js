"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsApp = sendWhatsApp;
exports.isWhatsAppConfigured = isWhatsAppConfigured;
const axios_1 = __importDefault(require("axios"));
const environment_1 = require("../../../config/environment");
const logger_1 = __importDefault(require("../../../shared/utils/logger"));
async function sendWhatsApp(payload) {
    try {
        // Development mode — log only
        if (environment_1.env.NODE_ENV === 'development' || !environment_1.env.WHATSAPP_PHONE_NUMBER_ID) {
            logger_1.default.info(`[DEV WHATSAPP] 📲 To: ${payload.to} | Body: "${payload.body}"`);
            return { success: true, message_id: `dev-wa-${Date.now()}` };
        }
        // Production: Meta WhatsApp Business API
        const url = `${environment_1.env.WHATSAPP_API_URL}/${environment_1.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        const phone = payload.to.replace('+', '');
        const requestBody = payload.template_name
            ? {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: {
                    name: payload.template_name,
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [{ type: 'text', text: payload.body }],
                        },
                    ],
                },
            }
            : {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'text',
                text: { body: payload.body },
            };
        const response = await axios_1.default.post(url, requestBody, {
            headers: {
                Authorization: `Bearer ${environment_1.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });
        const messageId = response.data?.messages?.[0]?.id;
        logger_1.default.info(`WhatsApp sent to ${payload.to}, ID: ${messageId}`);
        return { success: true, message_id: messageId };
    }
    catch (error) {
        const errMsg = error.response?.data?.error?.message || error.message;
        logger_1.default.error(`WhatsApp to ${payload.to} failed: ${errMsg}`);
        return { success: false, error: errMsg };
    }
}
function isWhatsAppConfigured() {
    return !!(environment_1.env.WHATSAPP_PHONE_NUMBER_ID && environment_1.env.WHATSAPP_ACCESS_TOKEN);
}
//# sourceMappingURL=whatsapp.channel.js.map