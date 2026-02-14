"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
// ── Migration: Create users table ──
// Run with: npx sequelize-cli db:migrate
// Or called programmatically from a migration runner
async function up(queryInterface) {
    await queryInterface.createTable('users', {
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
        },
        email: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        password_hash: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true, // null for Google/OTP-only users
        },
        phone: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: true,
            unique: true,
        },
        google_id: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true,
            unique: true,
        },
        photo_url: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        timezone: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'UTC',
        },
        is_verified: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_active: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        last_login_at: {
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
    });
    // ── Indexes ──
    await queryInterface.addIndex('users', ['email'], {
        unique: true,
        name: 'idx_users_email',
    });
    await queryInterface.addIndex('users', ['phone'], {
        unique: true,
        name: 'idx_users_phone',
        where: {
            phone: {
                [sequelize_1.DataTypes.ABSTRACT]: null, // only index non-null
            },
        },
    });
    await queryInterface.addIndex('users', ['google_id'], {
        unique: true,
        name: 'idx_users_google_id',
    });
    await queryInterface.addIndex('users', ['is_active'], {
        name: 'idx_users_is_active',
    });
}
async function down(queryInterface) {
    await queryInterface.dropTable('users');
}
//# sourceMappingURL=001_create_users.js.map