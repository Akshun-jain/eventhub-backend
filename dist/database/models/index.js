"use strict";
// ⚠️ Association order matters in Sequelize.
// Do not reorder without checking dependencies.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.DeviceToken = exports.Notification = exports.EventAttendance = exports.Event = exports.GroupMember = exports.Group = exports.User = void 0;
const user_model_1 = __importDefault(require("./user.model"));
exports.User = user_model_1.default;
const group_model_1 = __importDefault(require("./group.model"));
exports.Group = group_model_1.default;
const group_member_model_1 = __importDefault(require("./group-member.model"));
exports.GroupMember = group_member_model_1.default;
const event_model_1 = __importDefault(require("./event.model"));
exports.Event = event_model_1.default;
const event_attendance_model_1 = __importDefault(require("./event-attendance.model"));
exports.EventAttendance = event_attendance_model_1.default;
const notification_model_1 = __importDefault(require("./notification.model"));
exports.Notification = notification_model_1.default;
const device_token_model_1 = __importDefault(require("./device-token.model"));
exports.DeviceToken = device_token_model_1.default;
// ════════════════════════════════════════
// USER <-> GROUP (through GroupMember)
// ════════════════════════════════════════
user_model_1.default.belongsToMany(group_model_1.default, {
    through: group_member_model_1.default,
    foreignKey: 'user_id',
    otherKey: 'group_id',
    as: 'groups',
});
group_model_1.default.belongsToMany(user_model_1.default, {
    through: group_member_model_1.default,
    foreignKey: 'group_id',
    otherKey: 'user_id',
    as: 'members',
});
// ════════════════════════════════════════
// GROUP MEMBER direct associations
// ════════════════════════════════════════
group_member_model_1.default.belongsTo(user_model_1.default, { foreignKey: 'user_id', as: 'user' });
group_member_model_1.default.belongsTo(group_model_1.default, { foreignKey: 'group_id', as: 'group' });
user_model_1.default.hasMany(group_member_model_1.default, { foreignKey: 'user_id', as: 'memberships' });
group_model_1.default.hasMany(group_member_model_1.default, { foreignKey: 'group_id', as: 'groupMembers' });
// ════════════════════════════════════════
// GROUP CREATOR
// ════════════════════════════════════════
group_model_1.default.belongsTo(user_model_1.default, { foreignKey: 'created_by', as: 'creator' });
user_model_1.default.hasMany(group_model_1.default, { foreignKey: 'created_by', as: 'createdGroups' });
// ════════════════════════════════════════
// INVITED BY
// ════════════════════════════════════════
group_member_model_1.default.belongsTo(user_model_1.default, { foreignKey: 'invited_by', as: 'inviter' });
// ════════════════════════════════════════
// EVENT <-> GROUP
// ════════════════════════════════════════
event_model_1.default.belongsTo(group_model_1.default, { foreignKey: 'group_id', as: 'group' });
group_model_1.default.hasMany(event_model_1.default, { foreignKey: 'group_id', as: 'events' });
// ════════════════════════════════════════
// EVENT <-> USER (creator)
// ════════════════════════════════════════
event_model_1.default.belongsTo(user_model_1.default, { foreignKey: 'created_by', as: 'creator' });
user_model_1.default.hasMany(event_model_1.default, { foreignKey: 'created_by', as: 'createdEvents' });
// ════════════════════════════════════════
// EVENT ATTENDANCE
// ════════════════════════════════════════
event_attendance_model_1.default.belongsTo(event_model_1.default, { foreignKey: 'event_id', as: 'event' });
event_model_1.default.hasMany(event_attendance_model_1.default, { foreignKey: 'event_id', as: 'attendees' });
event_attendance_model_1.default.belongsTo(user_model_1.default, { foreignKey: 'user_id', as: 'user' });
user_model_1.default.hasMany(event_attendance_model_1.default, { foreignKey: 'user_id', as: 'eventAttendances' });
event_model_1.default.belongsToMany(user_model_1.default, {
    through: event_attendance_model_1.default,
    foreignKey: 'event_id',
    otherKey: 'user_id',
    as: 'attendingUsers',
});
user_model_1.default.belongsToMany(event_model_1.default, {
    through: event_attendance_model_1.default,
    foreignKey: 'user_id',
    otherKey: 'event_id',
    as: 'attendingEvents',
});
// ════════════════════════════════════════
// NOTIFICATION associations
// ════════════════════════════════════════
notification_model_1.default.belongsTo(user_model_1.default, { foreignKey: 'user_id', as: 'user' });
user_model_1.default.hasMany(notification_model_1.default, { foreignKey: 'user_id', as: 'notifications' });
notification_model_1.default.belongsTo(event_model_1.default, { foreignKey: 'event_id', as: 'event' });
event_model_1.default.hasMany(notification_model_1.default, { foreignKey: 'event_id', as: 'notifications' });
notification_model_1.default.belongsTo(group_model_1.default, { foreignKey: 'group_id', as: 'group' });
group_model_1.default.hasMany(notification_model_1.default, { foreignKey: 'group_id', as: 'notifications' });
// ════════════════════════════════════════
// DEVICE TOKEN associations
// ════════════════════════════════════════
device_token_model_1.default.belongsTo(user_model_1.default, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'CASCADE',
});
user_model_1.default.hasMany(device_token_model_1.default, {
    foreignKey: 'user_id',
    as: 'deviceTokens',
});
exports.db = {
    User: user_model_1.default,
    Group: group_model_1.default,
    GroupMember: group_member_model_1.default,
    Event: event_model_1.default,
    EventAttendance: event_attendance_model_1.default,
    Notification: notification_model_1.default,
    DeviceToken: device_token_model_1.default,
};
// future: Notification → DeviceToken relation
// Notification.belongsTo(DeviceToken, { foreignKey: 'device_token_id' })
//# sourceMappingURL=index.js.map