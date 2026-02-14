"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
class Notification extends sequelize_1.Model {
}
Notification.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    event_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'events',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    group_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'groups',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    channel: {
        type: sequelize_1.DataTypes.ENUM('push', 'sms', 'whatsapp', 'email'),
        allowNull: false,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    body: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'sent', 'delivered', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
    },
    scheduled_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    sent_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    // read_at is set when user opens the notification in app
    // delivered != read (push delivered does not mean user saw it)
    read_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    fail_reason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    retry_count: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    max_retries: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updated_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    indexes: [
        { name: 'idx_notifications_user_id', fields: ['user_id'] },
        { name: 'idx_notifications_event_id', fields: ['event_id'] },
        { name: 'idx_notifications_group_id', fields: ['group_id'] },
        { name: 'idx_notifications_status', fields: ['status'] },
        { name: 'idx_notifications_channel', fields: ['channel'] },
        { name: 'idx_notifications_scheduled', fields: ['scheduled_at'] },
        { name: 'idx_notifications_status_scheduled', fields: ['status', 'scheduled_at'] },
        { name: 'idx_notifications_user_status', fields: ['user_id', 'status'] },
        { name: 'idx_notifications_retry', fields: ['status', 'retry_count'] },
        { name: 'idx_notifications_user_unread', fields: ['user_id'], where: { read_at: null, }, },
    ],
});
exports.default = Notification;
//# sourceMappingURL=notification.model.js.map