"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsMiddleware = void 0;
const cors_1 = __importDefault(require("cors"));
// Allowed origins — add your frontend URLs here
const allowedOrigins = [
    'http://localhost:3000', // backend itself (for testing)
    'http://localhost:3001', // Next.js web app
    'http://localhost:8080', // alternative dev port
    'http://localhost:19006', // Expo web
];
// Read extra origins from env
if (process.env.CORS_ORIGINS) {
    const extras = process.env.CORS_ORIGINS.split(',').map((o) => o.trim());
    allowedOrigins.push(...extras);
}
exports.corsMiddleware = (0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) {
            callback(null, true);
            return;
        }
        // In development, allow everything
        if (process.env.NODE_ENV === 'development') {
            callback(null, true);
            return;
        }
        // In production, check against whitelist
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400, // 24 hours preflight cache
});
//# sourceMappingURL=cors.js.map