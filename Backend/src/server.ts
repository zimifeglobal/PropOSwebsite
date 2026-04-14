import 'dotenv/config';
import app from './app';
import connectDB from './config/database';
import { startCronJobs } from './services/cron.service';
import logger from './utils/logger';

const PORT = parseInt(process.env.PORT || '5000', 10);
const RELEASE_SHA = (process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || '').slice(0, 7) || 'unknown';
const RELEASE_BRANCH = process.env.RENDER_GIT_BRANCH || process.env.GIT_BRANCH || 'unknown';
const RELEASE_ID = process.env.RENDER_SERVICE_ID || process.env.RENDER_DEPLOY_ID || 'local';

const start = async (): Promise<void> => {
  // Bind the port FIRST so Render's port scanner detects it immediately.
  // MongoDB connection happens after — a slow or failing DB won't block startup.
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Release:     sha=${RELEASE_SHA} branch=${RELEASE_BRANCH} id=${RELEASE_ID}`);
    logger.info(`API Docs:    http://localhost:${PORT}/api/docs`);
    logger.info(`Health:      http://localhost:${PORT}/api/health`);
  });

  // Connect to DB after the server is already listening.
  // If this fails we log the error but do NOT exit — the health endpoint
  // will still respond and Render won't restart the service in a crash loop.
  await connectDB();

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
