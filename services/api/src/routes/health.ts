import { Router, Request, Response } from 'express';

export const healthRouter: Router = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  const response = {
    success: true,
    data: {
      status: 'ok',
      version: process.env.npm_package_version ?? '0.0.1',
      timestamp: new Date().toISOString(),
      services: {
        api: { status: 'ok' },
        // Phase 1+: add postgres, redis, ai_service checks
        postgres: { status: 'disabled', message: 'Not yet configured' },
        redis: { status: 'disabled', message: 'Not yet configured' },
        ai_service: { status: 'disabled', message: 'Not yet configured' },
        ollama: { status: 'disabled', message: 'Not yet configured' },
      },
    },
    error: null,
  };

  res.status(200).json(response);
});

