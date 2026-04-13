import mongoose from 'mongoose';
import logger from '../utils/logger';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string, {
      dbName: process.env.DB_NAME || 'PropOSweb',
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${err.message}`));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
    mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`MongoDB connection failed: ${message}`);
    // Do NOT call process.exit(1) here — the HTTP server is already bound
    // and Render's health checks need it to keep running. DB reconnection
    // will be retried automatically by Mongoose's reconnect logic.
  }
};

export default connectDB;
