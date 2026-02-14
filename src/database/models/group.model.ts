import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface GroupAttributes {
  id: string;
  name: string;
  description: string | null;
  type: 'family' | 'office' | 'school' | 'college' | 'community' | 'custom';
  icon_url: string | null;
  invite_code: string;
  invite_expires_at: Date | null;
  is_private: boolean;
  require_approval: boolean;
  max_members: number;
  member_count: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface GroupCreationAttributes
  extends Optional<
    GroupAttributes,
    | 'id'
    | 'description'
    | 'type'
    | 'icon_url'
    | 'invite_expires_at'
    | 'is_private'
    | 'require_approval'
    | 'max_members'
    | 'member_count'
    | 'created_at'
    | 'updated_at'
  > {}

class Group
  extends Model<GroupAttributes, GroupCreationAttributes>
  implements GroupAttributes
{
  public id!: string;
  public name!: string;
  public description!: string | null;
  public type!: 'family' | 'office' | 'school' | 'college' | 'community' | 'custom';
  public icon_url!: string | null;
  public invite_code!: string;
  public invite_expires_at!: Date | null;
  public is_private!: boolean;
  public require_approval!: boolean;
  public max_members!: number;
  public member_count!: number;
  public created_by!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Group.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [2, 100],
          msg: 'Group name must be 2-100 characters',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('family', 'office', 'school', 'college', 'community', 'custom'),
      allowNull: false,
      defaultValue: 'custom',
    },
    icon_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    invite_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    invite_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_private: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    require_approval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    max_members: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    member_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
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
    tableName: 'groups',
    timestamps: true,
    underscored: true,
  }
);

export default Group;