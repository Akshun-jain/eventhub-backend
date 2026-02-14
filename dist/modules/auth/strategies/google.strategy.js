"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleToken = verifyGoogleToken;
const logger_1 = __importDefault(require("../../../shared/utils/logger"));
const environment_1 = require("../../../config/environment");
// ── Verify Google ID token ──
// In production, use `google-auth-library`:
//   npm install google-auth-library
//   import { OAuth2Client } from 'google-auth-library';
//
// For now, this is a structured placeholder that:
// 1. Validates the token is not empty
// 2. In development, accepts a mock token format for testing
// 3. In production, you swap in the real Google verification
//
// The rest of the app (auth.service, auth.controller) already calls this
// function, so when you add the real library, nothing else changes.
async function verifyGoogleToken(idToken) {
    try {
        if (!idToken || idToken.trim() === '') {
            logger_1.default.warn('Google auth: empty token received');
            return null;
        }
        // ── Development mock ──
        // Send idToken as: "mock_GOOGLEID_EMAIL_NAME"
        // Example: "mock_abc123_john@gmail.com_John Doe"
        if (environment_1.env.NODE_ENV === 'development' && idToken.startsWith('mock_')) {
            const parts = idToken.split('_');
            // mock_googleId_email_name
            if (parts.length < 4) {
                logger_1.default.warn('Google auth: invalid mock token format. Use: mock_GOOGLEID_EMAIL_NAME');
                return null;
            }
            const googleId = parts[1];
            const email = parts[2];
            const name = parts.slice(3).join(' '); // name might have spaces
            logger_1.default.info(`[DEV GOOGLE] Mock verified: ${email} (${googleId})`);
            return {
                googleId,
                email,
                name,
                photoUrl: null,
                emailVerified: true,
            };
        }
        // ── Production: Real Google verification ──
        // Uncomment below when you install google-auth-library:
        //
        // const { OAuth2Client } = await import('google-auth-library');
        // const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
        //
        // const ticket = await client.verifyIdToken({
        //   idToken,
        //   audience: env.GOOGLE_CLIENT_ID,
        // });
        //
        // const payload = ticket.getPayload();
        // if (!payload) {
        //   logger.warn('Google auth: no payload in token');
        //   return null;
        // }
        //
        // return {
        //   googleId: payload.sub,
        //   email: payload.email || '',
        //   name: payload.name || '',
        //   photoUrl: payload.picture || null,
        //   emailVerified: payload.email_verified || false,
        // };
        // Until google-auth-library is installed, reject non-mock tokens
        logger_1.default.warn('Google auth: real token verification not yet configured');
        logger_1.default.warn('Install google-auth-library and add GOOGLE_CLIENT_ID to .env');
        return null;
    }
    catch (error) {
        logger_1.default.error('Google token verification failed:', error);
        return null;
    }
}
//# sourceMappingURL=google.strategy.js.map