import { Response } from 'express';

export interface ApiMeta {
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export const sendResponse = (
  res: Response,
  opts: {
    success: boolean;
    message: string;
    data?: unknown;
    meta?: ApiMeta;
    statusCode?: number;
  }
): void => {
  const { success, message, data, meta, statusCode = 200 } = opts;
  res.status(statusCode).json({
    success,
    message,
    ...(data !== undefined && { data }),
    ...(meta !== undefined && { meta }),
    timestamp: new Date().toISOString(),
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown
): void => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors !== undefined && { errors }),
    timestamp: new Date().toISOString(),
  });
};
