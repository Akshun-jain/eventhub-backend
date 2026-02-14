"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
class Event extends sequelize_1.Model {
}
Event.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
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
    title: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
        validate: {
            len: {
                args: [1, 200],
                msg: 'Title must be 1-200 characters',
            },
        },
    },
    person_name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: {
                args: [1, 100],
                msg: 'Person name must be 1-100 characters',
            },
        },
    },
    event_type: {
        type: sequelize_1.DataTypes.ENUM('birthday', 'anniversary', 'meeting', 'deadline', 'custom'),
        allowNull: false,
    },
    custom_type_name: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    event_date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    event_time: {
        type: sequelize_1.DataTypes.TIME,
        allowNull: true,
    },
    recurrence: {
        type: sequelize_1.DataTypes.ENUM('none', 'yearly', 'monthly', 'weekly'),
        allowNull: false,
        defaultValue: 'yearly',
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    attachment_url: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    remind_on_day: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    remind_days_before: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [1],
        validate: {
            isValidArray(value) {
                if (!Array.isArray(value)) {
                    throw new Error('remind_days_before must be an array');
                }
                for (const item of value) {
                    if (typeof item !== 'number' || !Number.isInteger(item) || item < 1 || item > 30) {
                        throw new Error('Each remind_days_before entry must be an integer between 1 and 30');
                    }
                }
            },
        },
    },
    next_occurrence: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    is_active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    created_by: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
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
    tableName: 'events',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_events_group_id',
            fields: ['group_id'],
        },
        {
            name: 'idx_events_event_date',
            fields: ['event_date'],
        },
        {
            name: 'idx_events_next_occurrence',
            fields: ['next_occurrence'],
        },
        {
            name: 'idx_events_event_type',
            fields: ['event_type'],
        },
        {
            name: 'idx_events_created_by',
            fields: ['created_by'],
        },
        {
            name: 'idx_events_is_active',
            fields: ['is_active'],
        },
        {
            name: 'idx_events_group_next',
            fields: ['group_id', 'next_occurrence'],
        },
        {
            name: 'idx_events_group_active',
            fields: ['group_id', 'is_active'],
        },
    ],
});
exports.default = Event;
//# sourceMappingURL=event.model.js.map