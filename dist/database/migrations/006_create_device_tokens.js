"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    await queryInterface.createTable('device_tokens', {
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        user_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        token: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
            unique: true,
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
    });
    await queryInterface.addIndex('device_tokens', ['user_id'], { name: 'idx_device_tokens_user_id' });
    await queryInterface.addIndex('device_tokens', ['token'], { name: 'idx_device_tokens_unique_active', unique: true, where: { is_active: true }, });
    await queryInterface.addIndex('device_tokens', ['user_id', 'is_active'], { name: 'idx_device_tokens_user_active' });
    await queryInterface.addIndex('device_tokens', ['platform'], { name: 'idx_device_tokens_platform', });
}
async function down(queryInterface) {
    await queryInterface.dropTable('device_tokens');
    // 🔥 Important: remove leftover ENUM type from PostgreSQL
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_device_tokens_platform";');
}
//# sourceMappingURL=006_create_device_tokens.js.map