"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
class Group extends sequelize_1.Model {
}
Group.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: {
                args: [2, 100],
                msg: 'Group name must be 2-100 characters',
            },
        },
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('family', 'office', 'school', 'college', 'community', 'custom'),
        allowNull: false,
        defaultValue: 'custom',
    },
    icon_url: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    invite_code: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    invite_expires_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    is_private: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    require_approval: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    max_members: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
    },
    member_count: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    tableName: 'groups',
    timestamps: true,
    underscored: true,
});
exports.default = Group;
//# sourceMappingURL=group.model.js.map