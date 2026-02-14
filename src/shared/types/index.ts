import { Request } from 'express';

// ── Authenticated request ──
// Every protected route handler receives this instead of plain Request
export interface AuthRequest extends Request {
  userId?: string;
}

// ── Standard API response shape ──
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}