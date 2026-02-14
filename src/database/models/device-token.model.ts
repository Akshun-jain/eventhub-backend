import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface DeviceTokenAttributes {
  id: string;
  user_id: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  device_name: string | null;
  is_active: boolean;
  last_used_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DeviceTokenCreationAttributes
  extends Optional<
    DeviceTokenAttributes,
    'id' | 'device_name' | 'is_active' | 'last_used_at' | 'created_at' | 'updated_at'
  > {}

class DeviceToken
  extends Model<DeviceTokenAttributes, DeviceTokenCreationAttributes>
  implements DeviceTokenAttributes
{
  public id!: string;
  public user_id!: string;
  public token!: string;
  public platform!: 'android' | 'ios' | 'web';
  public device_name!: string | null;
  public is_active!: boolean;
  public last_used_at!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

DeviceToken.init(
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
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
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
      allowNull: true,
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
    tableName: 'device_tokens',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_device_tokens_user_id',
        fields: ['user_id'],
      },
      {
        name: 'uniq_device_tokens_user_token',
        unique: true,
        fields: ['user_id', 'token'],
      },

      {
        name: 'idx_device_tokens_user_active',
        fields: ['user_id', 'is_active'],
      },
      {
        name: 'idx_device_tokens_platform',
        fields: ['platform'],
      },
    ],
  }
);

export default DeviceToken;