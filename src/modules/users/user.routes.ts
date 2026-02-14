import { Router } from 'express';
import { userController } from './user.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

// All user routes are protected
router.use(authMiddleware);

router.get('/profile', (req, res, next) =>
  userController.getProfile(req, res, next)
);

router.put('/profile', (req, res, next) =>
  userController.updateProfile(req, res, next)
);

router.delete('/account', (req, res, next) =>
  userController.deleteAccount(req, res, next)
);

export default router;