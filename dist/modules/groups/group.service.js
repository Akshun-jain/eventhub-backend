"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupService = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../../database/models");
const errorHandler_1 = require("../../shared/middleware/errorHandler");
const logger_1 = __importDefault(require("../../shared/utils/logger"));
// ── Generate random invite code ──
function generateInviteCode(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
class GroupService {
    // ── Create group ──
    async createGroup(userId, input) {
        const inviteCode = generateInviteCode();
        const group = await models_1.Group.create({
            name: input.name.trim(),
            description: input.description?.trim() || null,
            type: input.type || 'custom',
            invite_code: inviteCode,
            is_private: input.is_private !== false,
            require_approval: input.require_approval || false,
            max_members: input.max_members || 100,
            member_count: 1,
            created_by: userId,
        });
        // Add creator as owner
        await models_1.GroupMember.create({
            group_id: group.id,
            user_id: userId,
            role: 'owner',
            status: 'active',
            notify_push: true,
        });
        logger_1.default.info(`Group created: ${group.id} by user ${userId}`);
        return group.toJSON();
    }
    // ── Get all groups for a user ──
    async getUserGroups(userId) {
        const memberships = await models_1.GroupMember.findAll({
            where: { user_id: userId, status: 'active' },
            include: [
                {
                    model: models_1.Group,
                    as: 'group',
                    include: [
                        {
                            model: models_1.User,
                            as: 'creator',
                            attributes: ['id', 'name', 'email'],
                        },
                    ],
                },
            ],
            order: [['joined_at', 'DESC']],
        });
        return memberships.map((m) => {
            const raw = m.toJSON();
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
    async getGroupDetails(groupId, userId) {
        // Verify membership
        await this.requireMembership(groupId, userId);
        const group = await models_1.Group.findByPk(groupId, {
            include: [
                {
                    model: models_1.User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email'],
                },
            ],
        });
        if (!group) {
            throw new errorHandler_1.AppError('Group not found', 404);
        }
        // Get members
        const members = await models_1.GroupMember.findAll({
            where: { group_id: groupId, status: 'active' },
            include: [
                {
                    model: models_1.User,
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
                const raw = m.toJSON();
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
    async updateGroup(groupId, userId, input) {
        await this.requireAdminAccess(groupId, userId);
        const group = await models_1.Group.findByPk(groupId);
        if (!group) {
            throw new errorHandler_1.AppError('Group not found', 404);
        }
        const updateData = {};
        if (input.name !== undefined)
            updateData.name = input.name.trim();
        if (input.description !== undefined)
            updateData.description = input.description?.trim() || null;
        if (input.type !== undefined)
            updateData.type = input.type;
        if (input.is_private !== undefined)
            updateData.is_private = input.is_private;
        if (input.require_approval !== undefined)
            updateData.require_approval = input.require_approval;
        await group.update(updateData);
        logger_1.default.info(`Group updated: ${groupId} by user ${userId}`);
        return group.toJSON();
    }
    // ── Delete group (owner only) ──
    async deleteGroup(groupId, userId) {
        await this.requireOwnerAccess(groupId, userId);
        const group = await models_1.Group.findByPk(groupId);
        if (!group) {
            throw new errorHandler_1.AppError('Group not found', 404);
        }
        // Delete all members first, then group
        await models_1.GroupMember.destroy({ where: { group_id: groupId } });
        await group.destroy();
        logger_1.default.info(`Group deleted: ${groupId} by user ${userId}`);
    }
    // ── Generate new invite link ──
    async generateInviteLink(groupId, userId) {
        await this.requireAdminAccess(groupId, userId);
        const newCode = generateInviteCode();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await models_1.Group.update({ invite_code: newCode, invite_expires_at: expiresAt }, { where: { id: groupId } });
        logger_1.default.info(`New invite generated for group ${groupId}`);
        return {
            invite_code: newCode,
            expires_at: expiresAt.toISOString(),
        };
    }
    // ── Join group via invite code ──
    async joinGroup(inviteCode, userId) {
        const group = await models_1.Group.findOne({ where: { invite_code: inviteCode } });
        if (!group) {
            throw new errorHandler_1.AppError('Invalid invite code', 404);
        }
        // Check expiry
        if (group.invite_expires_at && new Date(group.invite_expires_at) < new Date()) {
            throw new errorHandler_1.AppError('Invite code has expired', 400);
        }
        // Check if already a member
        const existing = await models_1.GroupMember.findOne({
            where: { group_id: group.id, user_id: userId },
        });
        if (existing) {
            if (existing.status === 'active') {
                throw new errorHandler_1.AppError('Already a member of this group', 409);
            }
            // Reactivate if previously removed
            await existing.update({ status: 'active', joined_at: new Date() });
        }
        else {
            // Check capacity
            if (group.member_count >= group.max_members) {
                throw new errorHandler_1.AppError('Group is full', 400);
            }
            const status = group.require_approval ? 'pending' : 'active';
            await models_1.GroupMember.create({
                group_id: group.id,
                user_id: userId,
                role: 'member',
                status,
                notify_push: true,
            });
        }
        // Recount active members
        const activeCount = await models_1.GroupMember.count({
            where: { group_id: group.id, status: 'active' },
        });
        await group.update({ member_count: activeCount });
        logger_1.default.info(`User ${userId} joined group ${group.id}`);
        return group.toJSON();
    }
    // ── Invite member (admin/owner) ──
    async inviteMember(groupId, adminUserId, input) {
        await this.requireAdminAccess(groupId, adminUserId);
        // Find user by phone or email
        let targetUser = null;
        if (input.phone) {
            targetUser = await models_1.User.findOne({ where: { phone: input.phone.trim() } });
        }
        if (!targetUser && input.email) {
            targetUser = await models_1.User.findOne({ where: { email: input.email.trim().toLowerCase() } });
        }
        if (!targetUser) {
            throw new errorHandler_1.AppError('User not found with the provided phone or email', 404);
        }
        // Check if already a member
        const existing = await models_1.GroupMember.findOne({
            where: { group_id: groupId, user_id: targetUser.id },
        });
        if (existing && existing.status === 'active') {
            throw new errorHandler_1.AppError('User is already a member', 409);
        }
        if (existing) {
            await existing.update({
                status: 'active',
                role: input.role || 'member',
                invited_by: adminUserId,
                joined_at: new Date(),
            });
        }
        else {
            // Check capacity
            const group = await models_1.Group.findByPk(groupId);
            if (!group)
                throw new errorHandler_1.AppError('Group not found', 404);
            if (group.member_count >= group.max_members) {
                throw new errorHandler_1.AppError('Group is full', 400);
            }
            await models_1.GroupMember.create({
                group_id: groupId,
                user_id: targetUser.id,
                role: input.role || 'member',
                status: 'active',
                invited_by: adminUserId,
                notify_push: true,
            });
        }
        // Recount
        const activeCount = await models_1.GroupMember.count({
            where: { group_id: groupId, status: 'active' },
        });
        await models_1.Group.update({ member_count: activeCount }, { where: { id: groupId } });
        logger_1.default.info(`User ${targetUser.id} invited to group ${groupId} by ${adminUserId}`);
    }
    // ── Get members ──
    async getMembers(groupId, userId) {
        await this.requireMembership(groupId, userId);
        const members = await models_1.GroupMember.findAll({
            where: { group_id: groupId, status: 'active' },
            include: [
                {
                    model: models_1.User,
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
            const raw = m.toJSON();
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
    async updateMemberRole(groupId, ownerUserId, memberId, newRole) {
        await this.requireOwnerAccess(groupId, ownerUserId);
        const member = await models_1.GroupMember.findOne({
            where: { id: memberId, group_id: groupId, status: 'active' },
        });
        if (!member) {
            throw new errorHandler_1.AppError('Member not found', 404);
        }
        if (member.user_id === ownerUserId) {
            throw new errorHandler_1.AppError('Cannot change your own role', 400);
        }
        if (member.role === 'owner') {
            throw new errorHandler_1.AppError('Cannot change the owner role', 403);
        }
        await member.update({ role: newRole });
        logger_1.default.info(`Member ${memberId} role changed to ${newRole} in group ${groupId}`);
    }
    // ── Remove member (admin/owner) ──
    async removeMember(groupId, adminUserId, memberId) {
        await this.requireAdminAccess(groupId, adminUserId);
        const member = await models_1.GroupMember.findOne({
            where: { id: memberId, group_id: groupId },
        });
        if (!member) {
            throw new errorHandler_1.AppError('Member not found', 404);
        }
        if (member.user_id === adminUserId) {
            throw new errorHandler_1.AppError('Cannot remove yourself. Use leave instead.', 400);
        }
        if (member.role === 'owner') {
            throw new errorHandler_1.AppError('Cannot remove the group owner', 403);
        }
        await member.update({ status: 'removed' });
        // Recount
        const activeCount = await models_1.GroupMember.count({
            where: { group_id: groupId, status: 'active' },
        });
        await models_1.Group.update({ member_count: activeCount }, { where: { id: groupId } });
        logger_1.default.info(`Member ${memberId} removed from group ${groupId} by ${adminUserId}`);
    }
    // ── Leave group ──
    async leaveGroup(groupId, userId) {
        const member = await models_1.GroupMember.findOne({
            where: { group_id: groupId, user_id: userId, status: 'active' },
        });
        if (!member) {
            throw new errorHandler_1.AppError('You are not a member of this group', 404);
        }
        // Owner must transfer ownership first
        if (member.role === 'owner') {
            const otherMembers = await models_1.GroupMember.findAll({
                where: {
                    group_id: groupId,
                    user_id: { [sequelize_1.Op.ne]: userId },
                    status: 'active',
                },
                order: [['role', 'ASC'], ['joined_at', 'ASC']],
            });
            if (otherMembers.length === 0) {
                throw new errorHandler_1.AppError('You are the only member. Delete the group instead.', 400);
            }
            // Auto-transfer to next admin or first member
            const nextOwner = otherMembers[0];
            await nextOwner.update({ role: 'owner' });
            await models_1.Group.update({ created_by: nextOwner.user_id }, { where: { id: groupId } });
            logger_1.default.info(`Ownership transferred to ${nextOwner.user_id} in group ${groupId}`);
        }
        await member.update({ status: 'removed' });
        // Recount
        const activeCount = await models_1.GroupMember.count({
            where: { group_id: groupId, status: 'active' },
        });
        await models_1.Group.update({ member_count: activeCount }, { where: { id: groupId } });
        logger_1.default.info(`User ${userId} left group ${groupId}`);
    }
    // ── Update notification preferences ──
    async updateNotificationPrefs(groupId, userId, prefs) {
        const member = await models_1.GroupMember.findOne({
            where: { group_id: groupId, user_id: userId, status: 'active' },
        });
        if (!member) {
            throw new errorHandler_1.AppError('You are not a member of this group', 404);
        }
        const updateData = {};
        if (prefs.push !== undefined)
            updateData.notify_push = prefs.push;
        if (prefs.sms !== undefined)
            updateData.notify_sms = prefs.sms;
        if (prefs.whatsapp !== undefined)
            updateData.notify_whatsapp = prefs.whatsapp;
        if (prefs.email !== undefined)
            updateData.notify_email = prefs.email;
        await member.update(updateData);
        logger_1.default.info(`Notification prefs updated for user ${userId} in group ${groupId}`);
    }
    // ────────────────────────────────────────
    // ACCESS CONTROL HELPERS
    // ────────────────────────────────────────
    async requireMembership(groupId, userId) {
        const member = await models_1.GroupMember.findOne({
            where: { group_id: groupId, user_id: userId, status: 'active' },
        });
        if (!member) {
            throw new errorHandler_1.AppError('You are not a member of this group', 403);
        }
        return member;
    }
    async requireAdminAccess(groupId, userId) {
        const member = await this.requireMembership(groupId, userId);
        if (!['owner', 'admin'].includes(member.role)) {
            throw new errorHandler_1.AppError('Admin access required', 403);
        }
        return member;
    }
    async requireOwnerAccess(groupId, userId) {
        const member = await this.requireMembership(groupId, userId);
        if (member.role !== 'owner') {
            throw new errorHandler_1.AppError('Owner access required', 403);
        }
        return member;
    }
}
exports.groupService = new GroupService();
//# sourceMappingURL=group.service.js.map