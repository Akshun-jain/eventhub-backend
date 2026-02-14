"use strict";
// backend/src/models/SchedulerLock.ts
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
class SchedulerLock extends sequelize_1.Model {
}
SchedulerLock.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    jobName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        field: 'job_name',
    },
    lockKey: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: 'lock_key',
    },
    lockedBy: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        field: 'locked_by',
    },
    lockedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'locked_at',
    },
    expiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'expires_at',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('acquired', 'released', 'expired'),
        allowNull: false,
        defaultValue: 'acquired',
    },
    executionResult: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'execution_result',
    },
    executionDurationMs: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        field: 'execution_duration_ms',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'scheduler_locks',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['job_name', 'status'],
            name: 'idx_scheduler_locks_job_status',
        },
        {
            fields: ['expires_at'],
            name: 'idx_scheduler_locks_expires',
        },
    ],
});
exports.default = SchedulerLock;
//# sourceMappingURL=SchedulerLock.js.map