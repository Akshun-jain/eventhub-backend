"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../../config/database");
async function runMigrations() {
    try {
        console.log('🚀 Running migrations...\n');
        // Sync all models (since you're using model-based migrations)
        await database_1.sequelize.sync();
        console.log('✅ All migrations executed successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}
runMigrations();
//# sourceMappingURL=run.js.map