import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    data: null,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });

  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500;

  res.status(statusCode).json({
    success: false,
    data: null,
    // Don't leak internal details in production
    error:
      process.env.NODE_ENV === 'production' && statusCode >= 500
        ? 'Internal server error'
        : err.message,
  });
}
