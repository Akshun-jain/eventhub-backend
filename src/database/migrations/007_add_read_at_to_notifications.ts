import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.addColumn('notifications', 'read_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  });

  await queryInterface.addIndex('notifications', ['user_id', 'read_at'], {
    name: 'idx_notifications_user_unread',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeIndex('notifications', 'idx_notifications_user_unread');
  await queryInterface.removeColumn('notifications', 'read_at');
}