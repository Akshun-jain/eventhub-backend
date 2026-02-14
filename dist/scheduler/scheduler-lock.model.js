"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class SchedulerLock extends sequelize_1.Model {
}
SchedulerLock.init({
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
}, {
    sequelize: database_1.sequelize,
    tableName: 'scheduler_locks',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['job_name', 'status'], name: 'idx_scheduler_locks_job_status' },
        { fields: ['expires_at'], name: 'idx_scheduler_locks_expires' },
    ],
});
exports.default = SchedulerLock;
//# sourceMappingURL=scheduler-lock.model.js.map