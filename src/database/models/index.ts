// ⚠️ Association order matters in Sequelize.
// Do not reorder without checking dependencies.

import User from './user.model';
import Group from './group.model';
import GroupMember from './group-member.model';
import Event from './event.model';
import EventAttendance from './event-attendance.model';
import Notification from './notification.model';
import DeviceToken from './device-token.model';

// ════════════════════════════════════════
// USER <-> GROUP (through GroupMember)
// ════════════════════════════════════════

User.belongsToMany(Group, {
  through: GroupMember,
  foreignKey: 'user_id',
  otherKey: 'group_id',
  as: 'groups',
});

Group.belongsToMany(User, {
  through: GroupMember,
  foreignKey: 'group_id',
  otherKey: 'user_id',
  as: 'members',
});

// ════════════════════════════════════════
// GROUP MEMBER direct associations
// ════════════════════════════════════════

GroupMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
GroupMember.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });
User.hasMany(GroupMember, { foreignKey: 'user_id', as: 'memberships' });
Group.hasMany(GroupMember, { foreignKey: 'group_id', as: 'groupMembers' });

// ════════════════════════════════════════
// GROUP CREATOR
// ════════════════════════════════════════

Group.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Group, { foreignKey: 'created_by', as: 'createdGroups' });

// ════════════════════════════════════════
// INVITED BY
// ════════════════════════════════════════

GroupMember.belongsTo(User, { foreignKey: 'invited_by', as: 'inviter' });

// ════════════════════════════════════════
// EVENT <-> GROUP
// ════════════════════════════════════════

Event.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });
Group.hasMany(Event, { foreignKey: 'group_id', as: 'events' });

// ════════════════════════════════════════
// EVENT <-> USER (creator)
// ════════════════════════════════════════

Event.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Event, { foreignKey: 'created_by', as: 'createdEvents' });

// ════════════════════════════════════════
// EVENT ATTENDANCE
// ════════════════════════════════════════

EventAttendance.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
Event.hasMany(EventAttendance, { foreignKey: 'event_id', as: 'attendees' });
EventAttendance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(EventAttendance, { foreignKey: 'user_id', as: 'eventAttendances' });

Event.belongsToMany(User, {
  through: EventAttendance,
  foreignKey: 'event_id',
  otherKey: 'user_id',
  as: 'attendingUsers',
});

User.belongsToMany(Event, {
  through: EventAttendance,
  foreignKey: 'user_id',
  otherKey: 'event_id',
  as: 'attendingEvents',
});

// ════════════════════════════════════════
// NOTIFICATION associations
// ════════════════════════════════════════

Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

Notification.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
Event.hasMany(Notification, { foreignKey: 'event_id', as: 'notifications' });

Notification.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });
Group.hasMany(Notification, { foreignKey: 'group_id', as: 'notifications' });

// ════════════════════════════════════════
// DEVICE TOKEN associations
// ════════════════════════════════════════

DeviceToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE',
});

User.hasMany(DeviceToken, {
  foreignKey: 'user_id',
  as: 'deviceTokens',
});


// ════════════════════════════════════════
// EXPORT ALL MODELS
// ════════════════════════════════════════

export { User, Group, GroupMember, Event, EventAttendance, Notification, DeviceToken };

export const db = {
  User,
  Group,
  GroupMember,
  Event,
  EventAttendance,
  Notification,
  DeviceToken,
};


// future: Notification → DeviceToken relation
// Notification.belongsTo(DeviceToken, { foreignKey: 'device_token_id' })
