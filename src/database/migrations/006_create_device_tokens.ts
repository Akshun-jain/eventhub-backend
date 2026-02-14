import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('device_tokens', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    platform: {
      type: DataTypes.ENUM('android', 'ios', 'web'),
      allowNull: false,
    },
    device_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex('device_tokens', ['user_id'], { name: 'idx_device_tokens_user_id' });
  await queryInterface.addIndex('device_tokens', ['token'], { name: 'idx_device_tokens_unique_active',unique: true, where: { is_active: true },});
  await queryInterface.addIndex('device_tokens', ['user_id', 'is_active'], { name: 'idx_device_tokens_user_active' });
  await queryInterface.addIndex('device_tokens', ['platform'], { name: 'idx_device_tokens_platform',});
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('device_tokens');

  // 🔥 Important: remove leftover ENUM type from PostgreSQL
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_device_tokens_platform";'
  );
}
