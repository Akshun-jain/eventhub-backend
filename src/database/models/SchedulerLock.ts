// backend/src/models/SchedulerLock.ts

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface SchedulerLockAttributes {
  id: number;
  jobName: string;
  lockKey: string;
  lockedBy: string;
  lockedAt: Date;
  expiresAt: Date;
  status: 'acquired' | 'released' | 'expired';
  executionResult: string | null;
  executionDurationMs: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SchedulerLockCreation extends Optional<SchedulerLockAttributes,
  'id' | 'status' | 'executionResult' | 'executionDurationMs' | 'createdAt' | 'updatedAt'
> {}

class SchedulerLock extends Model<SchedulerLockAttributes, SchedulerLockCreation>
  implements SchedulerLockAttributes {
  public id!: number;
  public jobName!: string;
  public lockKey!: string;
  public lockedBy!: string;
  public lockedAt!: Date;
  public expiresAt!: Date;
  public status!: 'acquired' | 'released' | 'expired';
  public executionResult!: string | null;
  public executionDurationMs!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SchedulerLock.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    jobName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'job_name',
    },
    lockKey: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'lock_key',
    },
    lockedBy: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'locked_by',
    },
    lockedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'locked_at',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    status: {
      type: DataTypes.ENUM('acquired', 'released', 'expired'),
      allowNull: false,
      defaultValue: 'acquired',
    },
    executionResult: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'execution_result',
    },
    executionDurationMs: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'execution_duration_ms',
    },
  },
  {
    sequelize,
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
  }
);

export default SchedulerLock;