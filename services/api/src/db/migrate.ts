import 'dotenv/config';
import { runMigrations, pool } from './index';
import { logger } from '../middleware/logger';

async function main() {
  try {
    logger.info('Starting database migrations...');
    await runMigrations();
    logger.info('Database migrations completed successfully');
    await pool.end();
    process.exit(0);
  } catch (err) {
    logger.error('Migration failed:', err);
    await pool.end();
    process.exit(1);
  }
}

main();

