"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const group_controller_1 = require("./group.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const group_validators_1 = require("./group.validators");
const router = (0, express_1.Router)();
// All group routes require authentication
router.use(auth_middleware_1.authMiddleware);
// ── CRUD ──
router.post('/', group_validators_1.validateCreateGroup, (req, res, next) => group_controller_1.groupController.createGroup(req, res, next));
router.get('/', (req, res, next) => group_controller_1.groupController.getUserGroups(req, res, next));
router.get('/:groupId', group_validators_1.validateGroupId, (req, res, next) => group_controller_1.groupController.getGroupDetails(req, res, next));
router.put('/:groupId', group_validators_1.validateGroupId, group_validators_1.validateUpdateGroup, (req, res, next) => group_controller_1.groupController.updateGroup(req, res, next));
router.delete('/:groupId', group_validators_1.validateGroupId, (req, res, next) => group_controller_1.groupController.deleteGroup(req, res, next));
// ── Invite & Join ──
router.post('/:groupId/invite-link', group_validators_1.validateGroupId, (req, res, next) => group_controller_1.groupController.generateInviteLink(req, res, next));
router.post('/join/:inviteCode', group_validators_1.validateInviteCode, (req, res, next) => group_controller_1.groupController.joinGroup(req, res, next));
router.post('/:groupId/invite', group_validators_1.validateGroupId, group_validators_1.validateInviteMember, (req, res, next) => group_controller_1.groupController.inviteMember(req, res, next));
// ── Members ──
router.get('/:groupId/members', group_validators_1.validateGroupId, (req, res, next) => group_controller_1.groupController.getMembers(req, res, next));
router.put('/:groupId/members/:memberId/role', group_validators_1.validateGroupId, group_validators_1.validateMemberId, group_validators_1.validateUpdateMemberRole, (req, res, next) => group_controller_1.groupController.updateMemberRole(req, res, next));
router.delete('/:groupId/members/:memberId', group_validators_1.validateGroupId, group_validators_1.validateMemberId, (req, res, next) => group_controller_1.groupController.removeMember(req, res, next));
// ── Leave ──
router.post('/:groupId/leave', group_validators_1.validateGroupId, (req, res, next) => group_controller_1.groupController.leaveGroup(req, res, next));
// ── Notification preferences per group ──
router.put('/:groupId/notifications', group_validators_1.validateGroupId, group_validators_1.validateNotificationPrefs, (req, res, next) => group_controller_1.groupController.updateNotificationPrefs(req, res, next));
exports.default = router;
//# sourceMappingURL=group.routes.js.map