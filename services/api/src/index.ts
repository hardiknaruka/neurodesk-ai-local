import 'dotenv/config';
import { createApp } from './app';
import { logger } from './middleware/logger';

const PORT = Number(process.env.API_PORT) || 4000;
const HOST = process.env.API_HOST || '127.0.0.1';

async function main() {
  const { app, httpServer } = createApp();

  httpServer.listen(PORT, HOST, () => {
    logger.info(`NeuroDesk API running at http://${HOST}:${PORT}`);
    logger.info(`Health: http://${HOST}:${PORT}/api/v1/health`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

