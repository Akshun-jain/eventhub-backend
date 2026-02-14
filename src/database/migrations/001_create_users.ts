import { QueryInterface, DataTypes } from 'sequelize';

// ── Migration: Create users table ──
// Run with: npx sequelize-cli db:migrate
// Or called programmatically from a migration runner

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('users', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true, // null for Google/OTP-only users
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    photo_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'UTC',
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    last_login_at: {
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
  });

  // ── Indexes ──
  await queryInterface.addIndex('users', ['email'], {
    unique: true,
    name: 'idx_users_email',
  });

  await queryInterface.addIndex('users', ['phone'], {
    unique: true,
    name: 'idx_users_phone',
    where: {
      phone: {
        [DataTypes.ABSTRACT as unknown as symbol]: null, // only index non-null
      },
    },
  });

  await queryInterface.addIndex('users', ['google_id'], {
    unique: true,
    name: 'idx_users_google_id',
  });

  await queryInterface.addIndex('users', ['is_active'], {
    name: 'idx_users_is_active',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('users');
}