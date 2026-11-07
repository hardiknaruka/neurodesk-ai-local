import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { pool } from '../src/db';

describe('Phase 1 Integration Test Suite', () => {
  const { app } = createApp();

  const userA = {
    email: `alice_${Date.now()}@neurodesk.test`,
    password: 'password123',
    displayName: 'Alice User',
  };

  const userB = {
    email: `bob_${Date.now()}@neurodesk.test`,
    password: 'password456',
    displayName: 'Bob User',
  };

  let tokenA: string;
  let workspaceAId: string;

  let tokenB: string;
  let workspaceBId: string;

  let noteAId: string;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app).post('/api/v1/auth/register').send(userA);
    expect(resA.status).toBe(201);
    tokenA = resA.body.data.accessToken;
    workspaceAId = resA.body.data.workspace.id;

    // Register User B
    const resB = await request(app).post('/api/v1/auth/register').send(userB);
    expect(resB.status).toBe(201);
    tokenB = resB.body.data.accessToken;
    workspaceBId = resB.body.data.workspace.id;
  });

  // ── Authentication & Identity ─────────────────────────────────────────────

  it('allows User A to login and obtain token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userA.email, password: userA.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.workspace.id).toBe(workspaceAId);
  });

  it('rejects invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userA.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns profile via /auth/me with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(userA.email);
    expect(res.body.data.workspaces.length).toBeGreaterThan(0);
  });

  // ── Note CRUD & Workspace Isolation ───────────────────────────────────────

  it('creates a note in Workspace A', async () => {
    const res = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-workspace-id', workspaceAId)
      .send({
        title: 'Quantum Computing Research',
        body: 'Notes on superposition and qubits.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Quantum Computing Research');
    noteAId = res.body.data.id;
  });

  it('lists notes for Workspace A', async () => {
    const res = await request(app)
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-workspace-id', workspaceAId);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(noteAId);
  });

  it('updates a note in Workspace A', async () => {
    const res = await request(app)
      .put(`/api/v1/notes/${noteAId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-workspace-id', workspaceAId)
      .send({
        title: 'Quantum Computing Research (Updated)',
        body: 'Updated body content.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Quantum Computing Research (Updated)');
    expect(res.body.data.body).toBe('Updated body content.');
  });

  it('SECURITY: denies User B access to Workspace A (cross-tenant negative test)', async () => {
    const res = await request(app)
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-workspace-id', workspaceAId); // User B attempting to read Workspace A

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Forbidden');
  });

  it('SECURITY: denies User B modifying User A note', async () => {
    const res = await request(app)
      .put(`/api/v1/notes/${noteAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-workspace-id', workspaceBId) // Scoped to B, note is in A
      .send({ title: 'Hacked Title' });

    expect(res.status).toBe(404);
  });

  // ── File Upload & Validation ──────────────────────────────────────────────

  it('uploads a valid text document and stores metadata', async () => {
    const res = await request(app)
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-workspace-id', workspaceAId)
      .attach('file', Buffer.from('# NeuroDesk Test Document\nSample content'), 'sample.md');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.filename).toBe('sample.md');
    expect(res.body.data.hash).toBeDefined();
    expect(res.body.data.status).toBe('pending');
  });

  it('lists uploaded files in Workspace A', async () => {
    const res = await request(app)
      .get('/api/v1/files')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-workspace-id', workspaceAId);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].filename).toBe('sample.md');
  });

  it('rejects unsupported file extensions', async () => {
    const res = await request(app)
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-workspace-id', workspaceAId)
      .attach('file', Buffer.from('malicious payload'), 'danger.exe');

    expect(res.status).toBe(500); // Multer fileFilter error triggers errorHandler
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Unsupported file type');
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────

  it('deletes note from Workspace A', async () => {
    const res = await request(app)
      .delete(`/api/v1/notes/${noteAId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-workspace-id', workspaceAId);

    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);
  });
});

