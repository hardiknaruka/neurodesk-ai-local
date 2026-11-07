import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('GET /api/v1/health', () => {
  it('should return 200 with status ok and service list', async () => {
    const { app } = createApp();
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.services.api.status).toBe('ok');
    expect(res.body.data.timestamp).toBeDefined();
    expect(res.body.error).toBeNull();
  });

  it('should return 404 for unknown routes', async () => {
    const { app } = createApp();
    const res = await request(app).get('/api/v1/unknown');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Route not found');
  });
});

