import { Router } from 'express';
import { groupController } from './group.controller';
import { authMiddleware } from '../auth/auth.middleware';
import {
  validateCreateGroup,
  validateUpdateGroup,
  validateGroupId,
  validateInviteCode,
  validateInviteMember,
  validateMemberId,
  validateUpdateMemberRole,
  validateNotificationPrefs,
} from './group.validators';

const router = Router();

// All group routes require authentication
router.use(authMiddleware);

// ── CRUD ──
router.post('/', validateCreateGroup, (req, res, next) =>
  groupController.createGroup(req, res, next)
);

router.get('/', (req, res, next) =>
  groupController.getUserGroups(req, res, next)
);

router.get('/:groupId', validateGroupId, (req, res, next) =>
  groupController.getGroupDetails(req, res, next)
);

router.put('/:groupId', validateGroupId, validateUpdateGroup, (req, res, next) =>
  groupController.updateGroup(req, res, next)
);

router.delete('/:groupId', validateGroupId, (req, res, next) =>
  groupController.deleteGroup(req, res, next)
);

// ── Invite & Join ──
router.post('/:groupId/invite-link', validateGroupId, (req, res, next) =>
  groupController.generateInviteLink(req, res, next)
);

router.post('/join/:inviteCode', validateInviteCode, (req, res, next) =>
  groupController.joinGroup(req, res, next)
);

router.post('/:groupId/invite', validateGroupId, validateInviteMember, (req, res, next) =>
  groupController.inviteMember(req, res, next)
);

// ── Members ──
router.get('/:groupId/members', validateGroupId, (req, res, next) =>
  groupController.getMembers(req, res, next)
);

router.put(
  '/:groupId/members/:memberId/role',
  validateGroupId,
  validateMemberId,
  validateUpdateMemberRole,
  (req, res, next) => groupController.updateMemberRole(req, res, next)
);

router.delete(
  '/:groupId/members/:memberId',
  validateGroupId,
  validateMemberId,
  (req, res, next) => groupController.removeMember(req, res, next)
);

// ── Leave ──
router.post('/:groupId/leave', validateGroupId, (req, res, next) =>
  groupController.leaveGroup(req, res, next)
);

// ── Notification preferences per group ──
router.put(
  '/:groupId/notifications',
  validateGroupId,
  validateNotificationPrefs,
  (req, res, next) => groupController.updateNotificationPrefs(req, res, next)
);

export default router;