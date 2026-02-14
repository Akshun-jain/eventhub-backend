"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
class DeviceToken extends sequelize_1.Model {
}
DeviceToken.init({
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
    token: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    platform: {
        type: sequelize_1.DataTypes.ENUM('android', 'ios', 'web'),
        allowNull: false,
    },
    device_name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    is_active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    last_used_at: {
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
    tableName: 'device_tokens',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_device_tokens_user_id',
            fields: ['user_id'],
        },
        {
            name: 'uniq_device_tokens_user_token',
            unique: true,
            fields: ['user_id', 'token'],
        },
        {
            name: 'idx_device_tokens_user_active',
            fields: ['user_id', 'is_active'],
        },
        {
            name: 'idx_device_tokens_platform',
            fields: ['platform'],
        },
    ],
});
exports.default = DeviceToken;
//# sourceMappingURL=device-token.model.js.map