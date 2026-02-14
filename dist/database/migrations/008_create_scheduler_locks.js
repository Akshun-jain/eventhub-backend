"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    await queryInterface.createTable('scheduler_locks', {
        id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        job_name: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
        lock_key: { type: sequelize_1.DataTypes.STRING(255), allowNull: false, unique: true },
        locked_by: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
        locked_at: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        expires_at: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        status: {
            type: sequelize_1.DataTypes.ENUM('acquired', 'released', 'expired'),
            allowNull: false,
            defaultValue: 'acquired',
        },
        execution_result: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        execution_duration_ms: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
        updated_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    });
    await queryInterface.addIndex('scheduler_locks', ['job_name', 'status'], {
        name: 'idx_scheduler_locks_job_status',
    });
    await queryInterface.addIndex('scheduler_locks', ['expires_at'], {
        name: 'idx_scheduler_locks_expires',
    });
}
async function down(queryInterface) {
    await queryInterface.dropTable('scheduler_locks');
}
//# sourceMappingURL=008_create_scheduler_locks.js.map