import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface EventAttendanceAttributes {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'not_going' | 'maybe' | 'pending';
  note: string | null;
  responded_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface EventAttendanceCreationAttributes
  extends Optional<
    EventAttendanceAttributes,
    | 'id'
    | 'status'
    | 'note'
    | 'responded_at'
    | 'created_at'
    | 'updated_at'
  > {}

class EventAttendance
  extends Model<EventAttendanceAttributes, EventAttendanceCreationAttributes>
  implements EventAttendanceAttributes
{
  public id!: string;
  public event_id!: string;
  public user_id!: string;
  public status!: 'going' | 'not_going' | 'maybe' | 'pending';
  public note!: string | null;
  public responded_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

EventAttendance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('going', 'not_going', 'maybe', 'pending'),
      allowNull: false,
      defaultValue: 'pending',
    },
    note: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    responded_at: {
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
    tableName: 'event_attendance',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_attendance_event_user',
        unique: true,
        fields: ['event_id', 'user_id'],
      },
      {
        name: 'idx_attendance_event_id',
        fields: ['event_id'],
      },
      {
        name: 'idx_attendance_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_attendance_status',
        fields: ['status'],
      },
      {
        name: 'idx_attendance_event_status',
        fields: ['event_id', 'status'],
      },
    ],
  }
);

export default EventAttendance;