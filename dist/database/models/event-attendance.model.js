"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
class EventAttendance extends sequelize_1.Model {
}
EventAttendance.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
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
    user_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('going', 'not_going', 'maybe', 'pending'),
        allowNull: false,
        defaultValue: 'pending',
    },
    note: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    responded_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
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
    tableName: 'event_attendance',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_attendance_event_user',
            unique: true,
            fields: ['event_id', 'user_id'],
        },
        {
            name: 'idx_attendance_event_id',
            fields: ['event_id'],
        },
        {
            name: 'idx_attendance_user_id',
            fields: ['user_id'],
        },
        {
            name: 'idx_attendance_status',
            fields: ['status'],
        },
        {
            name: 'idx_attendance_event_status',
            fields: ['event_id', 'status'],
        },
    ],
});
exports.default = EventAttendance;
//# sourceMappingURL=event-attendance.model.js.map