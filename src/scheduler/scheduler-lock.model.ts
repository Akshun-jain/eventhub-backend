import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface SchedulerLockAttributes {
  id: number;
  job_name: string;
  lock_key: string;
  locked_by: string;
  locked_at: Date;
  expires_at: Date;
  status: 'acquired' | 'released' | 'expired';
  execution_result: string | null;
  execution_duration_ms: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface SchedulerLockCreation
  extends Optional<
    SchedulerLockAttributes,
    | 'id'
    | 'status'
    | 'execution_result'
    | 'execution_duration_ms'
    | 'created_at'
    | 'updated_at'
  > {}

class SchedulerLock
  extends Model<SchedulerLockAttributes, SchedulerLockCreation>
  implements SchedulerLockAttributes
{
  public id!: number;
  public job_name!: string;
  public lock_key!: string;
  public locked_by!: string;
  public locked_at!: Date;
  public expires_at!: Date;
  public status!: 'acquired' | 'released' | 'expired';
  public execution_result!: string | null;
  public execution_duration_ms!: number | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

SchedulerLock.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    job_name: { type: DataTypes.STRING(100), allowNull: false },

    lock_key: { type: DataTypes.STRING(255), allowNull: false, unique: true },

    locked_by: { type: DataTypes.STRING(100), allowNull: false },

    locked_at: { type: DataTypes.DATE, allowNull: false },

    expires_at: { type: DataTypes.DATE, allowNull: false },

    status: {
      type: DataTypes.ENUM('acquired', 'released', 'expired'),
      allowNull: false,
      defaultValue: 'acquired',
    },

    execution_result: { type: DataTypes.TEXT, allowNull: true },

    execution_duration_ms: { type: DataTypes.INTEGER, allowNull: true },

    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'scheduler_locks',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['job_name', 'status'], name: 'idx_scheduler_locks_job_status' },
      { fields: ['expires_at'], name: 'idx_scheduler_locks_expires' },
    ],
  }
);

export default SchedulerLock;
