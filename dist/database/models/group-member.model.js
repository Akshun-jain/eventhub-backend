"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
class GroupMember extends sequelize_1.Model {
}
GroupMember.init({
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
    user_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('owner', 'admin', 'member'),
        allowNull: false,
        defaultValue: 'member',
    },
    nickname: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    notify_push: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    notify_sms: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    notify_whatsapp: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    notify_email: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'pending', 'removed'),
        allowNull: false,
        defaultValue: 'active',
    },
    invited_by: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    joined_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
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
    tableName: 'group_members',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['group_id', 'user_id'],
            name: 'idx_group_members_unique',
        },
    ],
});
exports.default = GroupMember;
//# sourceMappingURL=group-member.model.js.map