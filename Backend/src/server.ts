import 'dotenv/config';
import app from './app';
import connectDB from './config/database';
import { startCronJobs } from './services/cron.service';
import logger from './utils/logger';

const PORT = parseInt(process.env.PORT || '5000', 10);

const start = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    // Render-compatible startup log
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API Docs:    http://localhost:${PORT}/api/docs`);
    logger.info(`Health:      http://localhost:${PORT}/api/health`);
  });

  if (process.env.CRON_ENABLED === 'true') {
    startCronJobs();
  }
};

start().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(`Failed to start server: ${message}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(`Unhandled Rejection: ${message}`);
  process.exit(1);
});
