import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

// ── What a users table row looks like ──
export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  is_admin: boolean;

}

// ── Fields that are auto-generated (optional during .create()) ──
export interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    'id' | 'phone' | 'is_active' | 'created_at' | 'updated_at' | 'is_admin'
  > {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public name!: string;
  public email!: string;
  public password_hash!: string;
  public phone!: string | null;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public is_admin!: boolean; // keep required in DB

  // Strip password_hash before sending to client
  public toSafeJSON(): Omit<UserAttributes, 'password_hash'> {
    const values = this.toJSON() as UserAttributes;
    const { password_hash, ...safe } = values;
    return safe;
  }
}

User.init(
  {
    is_admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

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
          msg: 'Name must be 2-100 characters',
        },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Must be a valid email' },
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'users',
    timestamps: true,
    underscored: true,
  }
);

export default User;