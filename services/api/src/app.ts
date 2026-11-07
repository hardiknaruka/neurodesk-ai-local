import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';
import { requestLogger } from './middleware/logger';
import { healthRouter } from './routes/health';
import { notFoundHandler, errorHandler } from './middleware/errors';

export function createApp(): { app: Application; httpServer: http.Server; io: SocketIOServer } {
  const app = express();

  // ── Security headers ───────────────────────────────
  app.use(helmet());
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? ['http://127.0.0.1:3000']
      : ['http://127.0.0.1:3000', 'http://localhost:3000'],
    credentials: true,
  }));

  // ── Body parsing ───────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Request logging ────────────────────────────────
  app.use(requestLogger);

  // ── Routes ─────────────────────────────────────────
  app.use('/api/v1', healthRouter);

  // ── 404 and error handlers ─────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  // ── Socket.IO ──────────────────────────────────────
  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: ['http://127.0.0.1:3000', 'http://localhost:3000'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Phase 2: wire up chat streaming and job status events
    socket.on('disconnect', () => {});
  });

  return { app, httpServer, io };
}
