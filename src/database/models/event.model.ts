import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface EventAttributes {
  id: string;
  group_id: string;
  title: string;
  person_name: string;
  event_type: 'birthday' | 'anniversary' | 'meeting' | 'deadline' | 'custom';
  custom_type_name: string | null;
  event_date: string;           // DATEONLY — stored as YYYY-MM-DD
  event_time: string | null;    // TIME — stored as HH:mm:ss
  recurrence: 'none' | 'yearly' | 'monthly' | 'weekly';
  notes: string | null;
  attachment_url: string | null;
  remind_on_day: boolean;
  remind_days_before: number[]; // e.g. [1, 3, 7]
  next_occurrence: string;      // DATEONLY — calculated next date
  is_active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface EventCreationAttributes
  extends Optional<
    EventAttributes,
    | 'id'
    | 'custom_type_name'
    | 'event_time'
    | 'recurrence'
    | 'notes'
    | 'attachment_url'
    | 'remind_on_day'
    | 'remind_days_before'
    | 'next_occurrence'
    | 'is_active'
    | 'created_at'
    | 'updated_at'
  > {}

class Event
  extends Model<EventAttributes, EventCreationAttributes>
  implements EventAttributes
{
  public id!: string;
  public group_id!: string;
  public title!: string;
  public person_name!: string;
  public event_type!: 'birthday' | 'anniversary' | 'meeting' | 'deadline' | 'custom';
  public custom_type_name!: string | null;
  public event_date!: string;
  public event_time!: string | null;
  public recurrence!: 'none' | 'yearly' | 'monthly' | 'weekly';
  public notes!: string | null;
  public attachment_url!: string | null;
  public remind_on_day!: boolean;
  public remind_days_before!: number[];
  public next_occurrence!: string;
  public is_active!: boolean;
  public created_by!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Event.init(
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: {
          args: [1, 200],
          msg: 'Title must be 1-200 characters',
        },
      },
    },
    person_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [1, 100],
          msg: 'Person name must be 1-100 characters',
        },
      },
    },
    event_type: {
      type: DataTypes.ENUM('birthday', 'anniversary', 'meeting', 'deadline', 'custom'),
      allowNull: false,
    },
    custom_type_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    event_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    event_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    recurrence: {
      type: DataTypes.ENUM('none', 'yearly', 'monthly', 'weekly'),
      allowNull: false,
      defaultValue: 'yearly',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachment_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    remind_on_day: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    remind_days_before: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [1],
      validate: {
        isValidArray(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('remind_days_before must be an array');
          }
          for (const item of value) {
            if (typeof item !== 'number' || !Number.isInteger(item) || item < 1 || item > 30) {
              throw new Error('Each remind_days_before entry must be an integer between 1 and 30');
            }
          }
        },
      },
    },
    next_occurrence: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'events',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_events_group_id',
        fields: ['group_id'],
      },
      {
        name: 'idx_events_event_date',
        fields: ['event_date'],
      },
      {
        name: 'idx_events_next_occurrence',
        fields: ['next_occurrence'],
      },
      {
        name: 'idx_events_event_type',
        fields: ['event_type'],
      },
      {
        name: 'idx_events_created_by',
        fields: ['created_by'],
      },
      {
        name: 'idx_events_is_active',
        fields: ['is_active'],
      },
      {
        name: 'idx_events_group_next',
        fields: ['group_id', 'next_occurrence'],
      },
      {
        name: 'idx_events_group_active',
        fields: ['group_id', 'is_active'],
      },
    ],
  }
);

export default Event;