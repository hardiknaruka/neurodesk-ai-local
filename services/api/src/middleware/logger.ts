import winston from 'winston';
import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.colorize({ all: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${level}: ${message}${metaStr}`;
        }),
  ),
  transports: [new winston.transports.Console()],
});

// Morgan HTTP request logger — redacts Authorization header
export const requestLogger = morgan(
  ':method :url :status :response-time ms',
  {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: (_req, res) => res.statusCode < 400 && process.env.NODE_ENV === 'test',
  },
);
