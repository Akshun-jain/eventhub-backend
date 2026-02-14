import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('scheduler_locks', {
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
  });

  await queryInterface.addIndex('scheduler_locks', ['job_name', 'status'], {
    name: 'idx_scheduler_locks_job_status',
  });

  await queryInterface.addIndex('scheduler_locks', ['expires_at'], {
    name: 'idx_scheduler_locks_expires',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('scheduler_locks');
}
