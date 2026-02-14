import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { groupService } from './group.service';
import { sendSuccess } from '../../shared/utils/response';

class GroupController {
  // POST /api/groups
  async createGroup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await groupService.createGroup(req.userId!, req.body);
      sendSuccess(res, { group }, 'Group created', 201);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/groups
  async getUserGroups(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const groups = await groupService.getUserGroups(req.userId!);
      sendSuccess(res, { groups }, 'Groups retrieved');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/groups/:groupId
  async getGroupDetails(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await groupService.getGroupDetails(req.params.groupId, req.userId!);
      sendSuccess(res, result, 'Group details retrieved');
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/groups/:groupId
  async updateGroup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await groupService.updateGroup(req.params.groupId, req.userId!, req.body);
      sendSuccess(res, { group }, 'Group updated');
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/groups/:groupId
  async deleteGroup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await groupService.deleteGroup(req.params.groupId, req.userId!);
      sendSuccess(res, null, 'Group deleted');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/groups/:groupId/invite-link
  async generateInviteLink(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await groupService.generateInviteLink(req.params.groupId, req.userId!);
      sendSuccess(res, result, 'Invite link generated');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/groups/join/:inviteCode
  async joinGroup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await groupService.joinGroup(req.params.inviteCode, req.userId!);
      sendSuccess(res, { group }, 'Joined group successfully');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/groups/:groupId/invite
  async inviteMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await groupService.inviteMember(req.params.groupId, req.userId!, req.body);
      sendSuccess(res, null, 'Member invited');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/groups/:groupId/members
  async getMembers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await groupService.getMembers(req.params.groupId, req.userId!);
      sendSuccess(res, { members }, 'Members retrieved');
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/groups/:groupId/members/:memberId/role
  async updateMemberRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await groupService.updateMemberRole(
        req.params.groupId,
        req.userId!,
        req.params.memberId,
        req.body.role
      );
      sendSuccess(res, null, 'Member role updated');
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/groups/:groupId/members/:memberId
  async removeMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await groupService.removeMember(req.params.groupId, req.userId!, req.params.memberId);
      sendSuccess(res, null, 'Member removed');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/groups/:groupId/leave
  async leaveGroup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await groupService.leaveGroup(req.params.groupId, req.userId!);
      sendSuccess(res, null, 'Left group');
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/groups/:groupId/notifications
  async updateNotificationPrefs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await groupService.updateNotificationPrefs(req.params.groupId, req.userId!, req.body);
      sendSuccess(res, null, 'Notification preferences updated');
    } catch (error) {
      next(error);
    }
  }
}

export const groupController = new GroupController();