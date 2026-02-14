"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupController = void 0;
const group_service_1 = require("./group.service");
const response_1 = require("../../shared/utils/response");
class GroupController {
    // POST /api/groups
    async createGroup(req, res, next) {
        try {
            const group = await group_service_1.groupService.createGroup(req.userId, req.body);
            (0, response_1.sendSuccess)(res, { group }, 'Group created', 201);
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/groups
    async getUserGroups(req, res, next) {
        try {
            const groups = await group_service_1.groupService.getUserGroups(req.userId);
            (0, response_1.sendSuccess)(res, { groups }, 'Groups retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/groups/:groupId
    async getGroupDetails(req, res, next) {
        try {
            const result = await group_service_1.groupService.getGroupDetails(req.params.groupId, req.userId);
            (0, response_1.sendSuccess)(res, result, 'Group details retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // PUT /api/groups/:groupId
    async updateGroup(req, res, next) {
        try {
            const group = await group_service_1.groupService.updateGroup(req.params.groupId, req.userId, req.body);
            (0, response_1.sendSuccess)(res, { group }, 'Group updated');
        }
        catch (error) {
            next(error);
        }
    }
    // DELETE /api/groups/:groupId
    async deleteGroup(req, res, next) {
        try {
            await group_service_1.groupService.deleteGroup(req.params.groupId, req.userId);
            (0, response_1.sendSuccess)(res, null, 'Group deleted');
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/groups/:groupId/invite-link
    async generateInviteLink(req, res, next) {
        try {
            const result = await group_service_1.groupService.generateInviteLink(req.params.groupId, req.userId);
            (0, response_1.sendSuccess)(res, result, 'Invite link generated');
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/groups/join/:inviteCode
    async joinGroup(req, res, next) {
        try {
            const group = await group_service_1.groupService.joinGroup(req.params.inviteCode, req.userId);
            (0, response_1.sendSuccess)(res, { group }, 'Joined group successfully');
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/groups/:groupId/invite
    async inviteMember(req, res, next) {
        try {
            await group_service_1.groupService.inviteMember(req.params.groupId, req.userId, req.body);
            (0, response_1.sendSuccess)(res, null, 'Member invited');
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/groups/:groupId/members
    async getMembers(req, res, next) {
        try {
            const members = await group_service_1.groupService.getMembers(req.params.groupId, req.userId);
            (0, response_1.sendSuccess)(res, { members }, 'Members retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // PUT /api/groups/:groupId/members/:memberId/role
    async updateMemberRole(req, res, next) {
        try {
            await group_service_1.groupService.updateMemberRole(req.params.groupId, req.userId, req.params.memberId, req.body.role);
            (0, response_1.sendSuccess)(res, null, 'Member role updated');
        }
        catch (error) {
            next(error);
        }
    }
    // DELETE /api/groups/:groupId/members/:memberId
    async removeMember(req, res, next) {
        try {
            await group_service_1.groupService.removeMember(req.params.groupId, req.userId, req.params.memberId);
            (0, response_1.sendSuccess)(res, null, 'Member removed');
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/groups/:groupId/leave
    async leaveGroup(req, res, next) {
        try {
            await group_service_1.groupService.leaveGroup(req.params.groupId, req.userId);
            (0, response_1.sendSuccess)(res, null, 'Left group');
        }
        catch (error) {
            next(error);
        }
    }
    // PUT /api/groups/:groupId/notifications
    async updateNotificationPrefs(req, res, next) {
        try {
            await group_service_1.groupService.updateNotificationPrefs(req.params.groupId, req.userId, req.body);
            (0, response_1.sendSuccess)(res, null, 'Notification preferences updated');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.groupController = new GroupController();
//# sourceMappingURL=group.controller.js.map