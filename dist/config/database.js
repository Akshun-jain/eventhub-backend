"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
exports.connectDatabase = connectDatabase;
const sequelize_1 = require("sequelize");
const environment_1 = require("./environment");
const logger_1 = __importDefault(require("../shared/utils/logger"));
exports.sequelize = new sequelize_1.Sequelize(environment_1.env.DB_NAME, environment_1.env.DB_USER, environment_1.env.DB_PASSWORD, {
    host: environment_1.env.DB_HOST,
    port: environment_1.env.DB_PORT,
    dialect: 'postgres',
    logging: environment_1.env.NODE_ENV === 'development'
        ? (sql) => logger_1.default.debug(sql)
        : false,
    pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000,
    },
    define: {
        timestamps: true,
        underscored: true,
    },
});
async function connectDatabase() {
    try {
        await exports.sequelize.authenticate();
        logger_1.default.info('Database connection established');
        if (environment_1.env.NODE_ENV === 'development') {
            await exports.sequelize.sync({ alter: true });
            logger_1.default.info('Database models synchronized');
        }
    }
    catch (error) {
        logger_1.default.error('Database connection failed:', error);
        throw error;
    }
}
//# sourceMappingURL=database.js.map