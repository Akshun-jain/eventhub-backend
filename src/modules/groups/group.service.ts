import { Op } from 'sequelize';
import { Group, GroupMember, User } from '../../database/models';
import { AppError } from '../../shared/middleware/errorHandler';
import logger from '../../shared/utils/logger';

// ── Generate random invite code ──
function generateInviteCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

interface CreateGroupInput {
  name: string;
  description?: string;
  type?: string;
  is_private?: boolean;
  require_approval?: boolean;
  max_members?: number;
}

interface UpdateGroupInput {
  name?: string;
  description?: string;
  type?: string;
  is_private?: boolean;
  require_approval?: boolean;
}

class GroupService {
  // ── Create group ──
  async createGroup(userId: string, input: CreateGroupInput) {
    const inviteCode = generateInviteCode();

    const group = await Group.create({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      type: (input.type as any) || 'custom',
      invite_code: inviteCode,
      is_private: input.is_private !== false,
      require_approval: input.require_approval || false,
      max_members: input.max_members || 100,
      member_count: 1,
      created_by: userId,
    });

    // Add creator as owner
    await GroupMember.create({
      group_id: group.id,
      user_id: userId,
      role: 'owner',
      status: 'active',
      notify_push: true,
    });

    logger.info(`Group created: ${group.id} by user ${userId}`);

    return group.toJSON();
  }

  // ── Get all groups for a user ──
  async getUserGroups(userId: string) {
    const memberships = await GroupMember.findAll({
      where: { user_id: userId, status: 'active' },
      include: [
        {
          model: Group,
          as: 'group',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      order: [['joined_at', 'DESC']],
    });

    return memberships.map((m) => {
      const raw = m.toJSON() as any;
      return {
        ...raw.group,
        my_role: raw.role,
        notification_prefs: {
          push: raw.notify_push,
          sms: raw.notify_sms,
          whatsapp: raw.notify_whatsapp,
          email: raw.notify_email,
        },
      };
    });
  }

  // ── Get group details ──
  async getGroupDetails(groupId: string, userId: string) {
    // Verify membership
    await this.requireMembership(groupId, userId);

    const group = await Group.findByPk(groupId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!group) {
      throw new AppError('Group not found', 404);
    }

    // Get members
    const members = await GroupMember.findAll({
      where: { group_id: groupId, status: 'active' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
      order: [
        ['role', 'ASC'],
        ['joined_at', 'ASC'],
      ],
    });

    // Find current user's role
    const myMembership = members.find((m) => m.user_id === userId);

    return {
      group: group.toJSON(),
      members: members.map((m) => {
        const raw = m.toJSON() as any;
        return {
          id: raw.id,
          user_id: raw.user_id,
          role: raw.role,
          status: raw.status,
          joined_at: raw.joined_at,
          user: raw.user,
        };
      }),
      my_role: myMembership?.role || null,
    };
  }

  // ── Update group (admin/owner only) ──
  async updateGroup(groupId: string, userId: string, input: UpdateGroupInput) {
    await this.requireAdminAccess(groupId, userId);

    const group = await Group.findByPk(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const updateData: Record<string, any> = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.description !== undefined) updateData.description = input.description?.trim() || null;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.is_private !== undefined) updateData.is_private = input.is_private;
    if (input.require_approval !== undefined) updateData.require_approval = input.require_approval;

    await group.update(updateData);

    logger.info(`Group updated: ${groupId} by user ${userId}`);

    return group.toJSON();
  }

  // ── Delete group (owner only) ──
  async deleteGroup(groupId: string, userId: string) {
    await this.requireOwnerAccess(groupId, userId);

    const group = await Group.findByPk(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    // Delete all members first, then group
    await GroupMember.destroy({ where: { group_id: groupId } });
    await group.destroy();

    logger.info(`Group deleted: ${groupId} by user ${userId}`);
  }

  // ── Generate new invite link ──
  async generateInviteLink(groupId: string, userId: string) {
    await this.requireAdminAccess(groupId, userId);

    const newCode = generateInviteCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await Group.update(
      { invite_code: newCode, invite_expires_at: expiresAt },
      { where: { id: groupId } }
    );

    logger.info(`New invite generated for group ${groupId}`);

    return {
      invite_code: newCode,
      expires_at: expiresAt.toISOString(),
    };
  }

  // ── Join group via invite code ──
  async joinGroup(inviteCode: string, userId: string) {
    const group = await Group.findOne({ where: { invite_code: inviteCode } });

    if (!group) {
      throw new AppError('Invalid invite code', 404);
    }

    // Check expiry
    if (group.invite_expires_at && new Date(group.invite_expires_at) < new Date()) {
      throw new AppError('Invite code has expired', 400);
    }

    // Check if already a member
    const existing = await GroupMember.findOne({
      where: { group_id: group.id, user_id: userId },
    });

    if (existing) {
      if (existing.status === 'active') {
        throw new AppError('Already a member of this group', 409);
      }
      // Reactivate if previously removed
      await existing.update({ status: 'active', joined_at: new Date() });
    } else {
      // Check capacity
      if (group.member_count >= group.max_members) {
        throw new AppError('Group is full', 400);
      }

      const status = group.require_approval ? 'pending' : 'active';

      await GroupMember.create({
        group_id: group.id,
        user_id: userId,
        role: 'member',
        status,
        notify_push: true,
      });
    }

    // Recount active members
    const activeCount = await GroupMember.count({
      where: { group_id: group.id, status: 'active' },
    });
    await group.update({ member_count: activeCount });

    logger.info(`User ${userId} joined group ${group.id}`);

    return group.toJSON();
  }

  // ── Invite member (admin/owner) ──
  async inviteMember(
    groupId: string,
    adminUserId: string,
    input: { phone?: string; email?: string; role?: string }
  ) {
    await this.requireAdminAccess(groupId, adminUserId);

    // Find user by phone or email
    let targetUser = null;
    if (input.phone) {
      targetUser = await User.findOne({ where: { phone: input.phone.trim() } });
    }
    if (!targetUser && input.email) {
      targetUser = await User.findOne({ where: { email: input.email.trim().toLowerCase() } });
    }

    if (!targetUser) {
      throw new AppError('User not found with the provided phone or email', 404);
    }

    // Check if already a member
    const existing = await GroupMember.findOne({
      where: { group_id: groupId, user_id: targetUser.id },
    });

    if (existing && existing.status === 'active') {
      throw new AppError('User is already a member', 409);
    }

    if (existing) {
      await existing.update({
        status: 'active',
        role: (input.role as any) || 'member',
        invited_by: adminUserId,
        joined_at: new Date(),
      });
    } else {
      // Check capacity
      const group = await Group.findByPk(groupId);
      if (!group) throw new AppError('Group not found', 404);

      if (group.member_count >= group.max_members) {
        throw new AppError('Group is full', 400);
      }

      await GroupMember.create({
        group_id: groupId,
        user_id: targetUser.id,
        role: (input.role as any) || 'member',
        status: 'active',
        invited_by: adminUserId,
        notify_push: true,
      });
    }

    // Recount
    const activeCount = await GroupMember.count({
      where: { group_id: groupId, status: 'active' },
    });
    await Group.update({ member_count: activeCount }, { where: { id: groupId } });

    logger.info(`User ${targetUser.id} invited to group ${groupId} by ${adminUserId}`);
  }

  // ── Get members ──
  async getMembers(groupId: string, userId: string) {
    await this.requireMembership(groupId, userId);

    const members = await GroupMember.findAll({
      where: { group_id: groupId, status: 'active' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
      order: [
        ['role', 'ASC'],
        ['joined_at', 'ASC'],
      ],
    });

    return members.map((m) => {
      const raw = m.toJSON() as any;
      return {
        id: raw.id,
        user_id: raw.user_id,
        role: raw.role,
        status: raw.status,
        joined_at: raw.joined_at,
        user: raw.user,
      };
    });
  }

  // ── Update member role (owner only) ──
  async updateMemberRole(
    groupId: string,
    ownerUserId: string,
    memberId: string,
    newRole: string
  ) {
    await this.requireOwnerAccess(groupId, ownerUserId);

    const member = await GroupMember.findOne({
      where: { id: memberId, group_id: groupId, status: 'active' },
    });

    if (!member) {
      throw new AppError('Member not found', 404);
    }

    if (member.user_id === ownerUserId) {
      throw new AppError('Cannot change your own role', 400);
    }

    if (member.role === 'owner') {
      throw new AppError('Cannot change the owner role', 403);
    }

    await member.update({ role: newRole as any });

    logger.info(`Member ${memberId} role changed to ${newRole} in group ${groupId}`);
  }

  // ── Remove member (admin/owner) ──
  async removeMember(groupId: string, adminUserId: string, memberId: string) {
    await this.requireAdminAccess(groupId, adminUserId);

    const member = await GroupMember.findOne({
      where: { id: memberId, group_id: groupId },
    });

    if (!member) {
      throw new AppError('Member not found', 404);
    }

    if (member.user_id === adminUserId) {
      throw new AppError('Cannot remove yourself. Use leave instead.', 400);
    }

    if (member.role === 'owner') {
      throw new AppError('Cannot remove the group owner', 403);
    }

    await member.update({ status: 'removed' });

    // Recount
    const activeCount = await GroupMember.count({
      where: { group_id: groupId, status: 'active' },
    });
    await Group.update({ member_count: activeCount }, { where: { id: groupId } });

    logger.info(`Member ${memberId} removed from group ${groupId} by ${adminUserId}`);
  }

  // ── Leave group ──
  async leaveGroup(groupId: string, userId: string) {
    const member = await GroupMember.findOne({
      where: { group_id: groupId, user_id: userId, status: 'active' },
    });

    if (!member) {
      throw new AppError('You are not a member of this group', 404);
    }

    // Owner must transfer ownership first
    if (member.role === 'owner') {
      const otherMembers = await GroupMember.findAll({
        where: {
          group_id: groupId,
          user_id: { [Op.ne]: userId },
          status: 'active',
        },
        order: [['role', 'ASC'], ['joined_at', 'ASC']],
      });

      if (otherMembers.length === 0) {
        throw new AppError(
          'You are the only member. Delete the group instead.',
          400
        );
      }

      // Auto-transfer to next admin or first member
      const nextOwner = otherMembers[0];
      await nextOwner.update({ role: 'owner' });
      await Group.update(
        { created_by: nextOwner.user_id },
        { where: { id: groupId } }
      );

      logger.info(`Ownership transferred to ${nextOwner.user_id} in group ${groupId}`);
    }

    await member.update({ status: 'removed' });

    // Recount
    const activeCount = await GroupMember.count({
      where: { group_id: groupId, status: 'active' },
    });
    await Group.update({ member_count: activeCount }, { where: { id: groupId } });

    logger.info(`User ${userId} left group ${groupId}`);
  }

  // ── Update notification preferences ──
  async updateNotificationPrefs(
    groupId: string,
    userId: string,
    prefs: { push?: boolean; sms?: boolean; whatsapp?: boolean; email?: boolean }
  ) {
    const member = await GroupMember.findOne({
      where: { group_id: groupId, user_id: userId, status: 'active' },
    });

    if (!member) {
      throw new AppError('You are not a member of this group', 404);
    }

    const updateData: Record<string, any> = {};
    if (prefs.push !== undefined) updateData.notify_push = prefs.push;
    if (prefs.sms !== undefined) updateData.notify_sms = prefs.sms;
    if (prefs.whatsapp !== undefined) updateData.notify_whatsapp = prefs.whatsapp;
    if (prefs.email !== undefined) updateData.notify_email = prefs.email;

    await member.update(updateData);

    logger.info(`Notification prefs updated for user ${userId} in group ${groupId}`);
  }

  // ────────────────────────────────────────
  // ACCESS CONTROL HELPERS
  // ────────────────────────────────────────

  private async requireMembership(groupId: string, userId: string): Promise<GroupMember> {
    const member = await GroupMember.findOne({
      where: { group_id: groupId, user_id: userId, status: 'active' },
    });

    if (!member) {
      throw new AppError('You are not a member of this group', 403);
    }

    return member;
  }

  private async requireAdminAccess(groupId: string, userId: string): Promise<GroupMember> {
    const member = await this.requireMembership(groupId, userId);

    if (!['owner', 'admin'].includes(member.role)) {
      throw new AppError('Admin access required', 403);
    }

    return member;
  }

  private async requireOwnerAccess(groupId: string, userId: string): Promise<GroupMember> {
    const member = await this.requireMembership(groupId, userId);

    if (member.role !== 'owner') {
      throw new AppError('Owner access required', 403);
    }

    return member;
  }
}

export const groupService = new GroupService();