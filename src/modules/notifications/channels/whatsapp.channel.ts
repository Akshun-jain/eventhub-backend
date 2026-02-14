import axios from 'axios';
import { env } from '../../../config/environment';
import logger from '../../../shared/utils/logger';

export interface WhatsAppPayload {
  to: string;    // phone number without +
  body: string;
  template_name?: string;
}

export interface WhatsAppResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

export async function sendWhatsApp(payload: WhatsAppPayload): Promise<WhatsAppResult> {
  try {
    // Development mode — log only
    if (env.NODE_ENV === 'development' || !env.WHATSAPP_PHONE_NUMBER_ID) {
      logger.info(
        `[DEV WHATSAPP] 📲 To: ${payload.to} | Body: "${payload.body}"`
      );
      return { success: true, message_id: `dev-wa-${Date.now()}` };
    }

    // Production: Meta WhatsApp Business API
    const url = `${env.WHATSAPP_API_URL}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
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

    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    const messageId = response.data?.messages?.[0]?.id;
    logger.info(`WhatsApp sent to ${payload.to}, ID: ${messageId}`);
    return { success: true, message_id: messageId };
  } catch (error: any) {
    const errMsg = error.response?.data?.error?.message || error.message;
    logger.error(`WhatsApp to ${payload.to} failed: ${errMsg}`);
    return { success: false, error: errMsg };
  }
}

export function isWhatsAppConfigured(): boolean {
  return !!(env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN);
}