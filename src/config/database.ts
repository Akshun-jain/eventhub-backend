import { Sequelize } from 'sequelize';
import { env } from './environment';
import logger from '../shared/utils/logger';

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging:
    env.NODE_ENV === 'development'
      ? (sql: string) => logger.debug(sql)
      : false,
  dialectOptions: {
    ssl:
      env.NODE_ENV === 'production'
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
  },
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

export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    if (env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized');
    }
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}
