import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface GroupMemberAttributes {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  nickname: string | null;
  notify_push: boolean;
  notify_sms: boolean;
  notify_whatsapp: boolean;
  notify_email: boolean;
  status: 'active' | 'pending' | 'removed';
  invited_by: string | null;
  joined_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface GroupMemberCreationAttributes
  extends Optional<
    GroupMemberAttributes,
    | 'id'
    | 'role'
    | 'nickname'
    | 'notify_push'
    | 'notify_sms'
    | 'notify_whatsapp'
    | 'notify_email'
    | 'status'
    | 'invited_by'
    | 'joined_at'
    | 'created_at'
    | 'updated_at'
  > {}

class GroupMember
  extends Model<GroupMemberAttributes, GroupMemberCreationAttributes>
  implements GroupMemberAttributes
{
  public id!: string;
  public group_id!: string;
  public user_id!: string;
  public role!: 'owner' | 'admin' | 'member';
  public nickname!: string | null;
  public notify_push!: boolean;
  public notify_sms!: boolean;
  public notify_whatsapp!: boolean;
  public notify_email!: boolean;
  public status!: 'active' | 'pending' | 'removed';
  public invited_by!: string | null;
  public joined_at!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

GroupMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'member'),
      allowNull: false,
      defaultValue: 'member',
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    notify_push: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    notify_sms: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    notify_whatsapp: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    notify_email: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'pending', 'removed'),
      allowNull: false,
      defaultValue: 'active',
    },
    invited_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    joined_at: {
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
  },
  {
    sequelize,
    tableName: 'group_members',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['group_id', 'user_id'],
        name: 'idx_group_members_unique',
      },
    ],
  }
);

export default GroupMember;