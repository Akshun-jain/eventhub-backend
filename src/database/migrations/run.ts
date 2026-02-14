import { sequelize } from '../../config/database';

async function runMigrations() {
  try {
    console.log('🚀 Running migrations...\n');

    // Sync all models (since you're using model-based migrations)
    await sequelize.sync();

    console.log('✅ All migrations executed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
