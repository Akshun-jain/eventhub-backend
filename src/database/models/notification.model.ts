import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface NotificationAttributes {
  id: string;
  user_id: string;
  event_id: string;
  group_id: string;
  channel: 'push' | 'sms' | 'whatsapp' | 'email';
  title: string;
  body: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  scheduled_at: Date;
  sent_at: Date | null;
  read_at: Date | null;
  fail_reason: string | null;
  retry_count: number;
  max_retries: number;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationCreationAttributes
  extends Optional<
    NotificationAttributes,
    | 'id'
    | 'status'
    | 'sent_at'
    | 'read_at'
    | 'fail_reason'
    | 'retry_count'
    | 'max_retries'
    | 'metadata'
    | 'created_at'
    | 'updated_at'
  > {}

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: string;
  public user_id!: string;
  public event_id!: string;
  public group_id!: string;
  public channel!: 'push' | 'sms' | 'whatsapp' | 'email';
  public title!: string;
  public body!: string;
  public status!: 'pending' | 'sent' | 'delivered' | 'failed';
  public scheduled_at!: Date;
  public sent_at!: Date | null;
  public read_at!: Date | null;
  public fail_reason!: string | null;
  public retry_count!: number;
  public max_retries!: number;
  public metadata!: Record<string, any>;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    channel: {
      type: DataTypes.ENUM('push', 'sms', 'whatsapp', 'email'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // read_at is set when user opens the notification in app
    // delivered != read (push delivered does not mean user saw it)

    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fail_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    retry_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    max_retries: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
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
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    indexes: [
      { name: 'idx_notifications_user_id', fields: ['user_id'] },
      { name: 'idx_notifications_event_id', fields: ['event_id'] },
      { name: 'idx_notifications_group_id', fields: ['group_id'] },
      { name: 'idx_notifications_status', fields: ['status'] },
      { name: 'idx_notifications_channel', fields: ['channel'] },
      { name: 'idx_notifications_scheduled', fields: ['scheduled_at'] },
      { name: 'idx_notifications_status_scheduled', fields: ['status', 'scheduled_at'] },
      { name: 'idx_notifications_user_status', fields: ['user_id', 'status'] },
      { name: 'idx_notifications_retry', fields: ['status', 'retry_count'] },
      { name: 'idx_notifications_user_unread', fields: ['user_id'], where: {read_at: null,}, },
    ],
  }
);

export default Notification;