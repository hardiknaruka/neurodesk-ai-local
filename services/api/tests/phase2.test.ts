import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { query } from '../src/db';

const { app } = createApp();

let userToken: string;
let workspaceId: string;
let userBToken: string;
let workspaceBId: string;

describe('Phase 2 Chat & RAG Integration Suite', () => {
  beforeAll(async () => {
    const timestamp = Date.now();

    // Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `alice_rag_${timestamp}@neurodesk.test`,
        password: 'Password123!',
        displayName: 'Alice Researcher',
      });
    userToken = resA.body.data.accessToken;
    workspaceId = resA.body.data.workspace.id;

    // Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `bob_rag_${timestamp}@neurodesk.test`,
        password: 'Password123!',
        displayName: 'Bob Stranger',
      });
    userBToken = resB.body.data.accessToken;
    workspaceBId = resB.body.data.workspace.id;
  });

  it('rejects unauthenticated chat requests with 401', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .send({ message: 'Hello' });
    expect(res.status).toBe(401);
  });

  it('rejects cross-workspace chat requests with 403 (Tenant Isolation)', async () => {
    // User B trying to post into User A's workspace
    const res = await request(app)
      .post('/api/v1/chat')
      .set('Authorization', `Bearer ${userBToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ message: 'Intrusion attempt' });
    expect(res.status).toBe(403);
  });

  it('successfully creates conversation and processes chat message', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .set('Authorization', `Bearer ${userToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ message: 'What is neuroplasticity?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.conversationId).toBeDefined();
    expect(res.body.data.userMessage.content).toBe('What is neuroplasticity?');
    expect(res.body.data.assistantMessage.role).toBe('assistant');
    expect(res.body.data.assistantMessage.content).toBeDefined();

    const convId = res.body.data.conversationId;

    // List conversations
    const listRes = await request(app)
      .get('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${userToken}`)
      .set('x-workspace-id', workspaceId);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(listRes.body.data[0].id).toBe(convId);

    // List messages
    const msgsRes = await request(app)
      .get(`/api/v1/chat/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${userToken}`)
      .set('x-workspace-id', workspaceId);

    expect(msgsRes.status).toBe(200);
    expect(msgsRes.body.data.length).toBe(2); // user + assistant

    // User B cannot access User A's conversation messages
    const crossRes = await request(app)
      .get(`/api/v1/chat/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${userBToken}`)
      .set('x-workspace-id', workspaceBId);

    expect(crossRes.status).toBe(200);
    expect(crossRes.body.data.length).toBe(0); // Scoped to workspaceB -> zero results

    // Delete conversation
    const delRes = await request(app)
      .delete(`/api/v1/chat/conversations/${convId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .set('x-workspace-id', workspaceId);

    expect(delRes.status).toBe(200);
    expect(delRes.body.data.deleted).toBe(true);
  });
});

