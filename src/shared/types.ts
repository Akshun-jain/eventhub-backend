import { Request } from 'express';
import { UserAttributes } from '../database/models/user.model';

export interface AuthRequest extends Request {
  userId?: string;
  user?: UserAttributes;
}
