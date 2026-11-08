import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, requireWorkspace } from '../middleware/auth';
import { logger } from '../middleware/logger';
import { queryRag } from '../services/aiClient';

export const chatRouter: Router = Router();

const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5000),
  conversationId: z.string().uuid().optional(),
  allowedDocumentIds: z.array(z.string().uuid()).optional(),
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// POST /api/v1/chat
chatRouter.post('/chat', authenticate, requireWorkspace, async (req: Request, res: Response) => {
  const parseResult = chatRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      data: null,
      error: parseResult.error.errors[0]?.message || 'Invalid chat request',
    });
    return;
  }

  const { message, conversationId, allowedDocumentIds } = parseResult.data;
  const workspaceId = req.workspaceId!;
  const userId = req.user!.userId;

  try {
    let activeConvId = conversationId;

    // Create or verify conversation
    if (!activeConvId) {
      const title = message.slice(0, 40) + (message.length > 40 ? '...' : '');
      const convRes = await query(
        `INSERT INTO conversations (workspace_id, user_id, title)
         VALUES ($1, $2, $3)
         RETURNING id, workspace_id, title, created_at`,
        [workspaceId, userId, title],
      );
      activeConvId = convRes.rows[0].id;
    } else {
      const convCheck = await query(
        `SELECT id FROM conversations WHERE id = $1 AND workspace_id = $2`,
        [activeConvId, workspaceId],
      );
      if (convCheck.rows.length === 0) {
        res.status(404).json({
          success: false,
          data: null,
          error: 'Conversation not found in this workspace',
        });
        return;
      }
    }

    // Record user message
    const userMsgRes = await query(
      `INSERT INTO messages (conversation_id, workspace_id, user_id, role, content)
       VALUES ($1, $2, $3, 'user', $4)
       RETURNING id, conversation_id, role, content, citations, model_provider, created_at`,
      [activeConvId, workspaceId, userId, message],
    );

    // Call Python AI Service for Grounded RAG synthesis
    let ragResult;
    try {
      ragResult = await queryRag({
        workspaceId,
        query: message,
        topK: 5,
        allowedDocumentIds,
      });
    } catch (err: any) {
      logger.error('RAG synthesis error:', err);
      ragResult = {
        answer: 'I encountered an error retrieving documents from your local AI service. Please ensure Ollama is running.',
        citations: [],
        relevantChunksCount: 0,
      };
    }

    // Record assistant message
    const assistantMsgRes = await query(
      `INSERT INTO messages (conversation_id, workspace_id, user_id, role, content, citations, model_provider)
       VALUES ($1, $2, $3, 'assistant', $4, $5, 'local-ollama')
       RETURNING id, conversation_id, role, content, citations, model_provider, created_at`,
      [activeConvId, workspaceId, userId, ragResult.answer, JSON.stringify(ragResult.citations)],
    );

    // Refresh conversation timestamp so it sorts properly to top of list
    await query(`UPDATE conversations SET updated_at = NOW() WHERE id = $1`, [activeConvId]);

    res.status(200).json({
      success: true,
      data: {
        conversationId: activeConvId,
        userMessage: userMsgRes.rows[0],
        assistantMessage: assistantMsgRes.rows[0],
        relevantChunksCount: ragResult.relevantChunksCount,
      },
      error: null,
    });
  } catch (err) {
    logger.error('Failed to process chat request', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to process chat query',
    });
  }
});

// GET /api/v1/chat/conversations
chatRouter.get('/chat/conversations', authenticate, requireWorkspace, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, workspace_id, title, created_at, updated_at
       FROM conversations
       WHERE workspace_id = $1
       ORDER BY updated_at DESC`,
      [req.workspaceId],
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      error: null,
    });
  } catch (err) {
    logger.error('Failed to list conversations', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to load conversations',
    });
  }
});

// GET /api/v1/chat/conversations/:id/messages
chatRouter.get('/chat/conversations/:id/messages', authenticate, requireWorkspace, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!UUID_REGEX.test(id)) {
    res.status(400).json({ success: false, data: null, error: 'Invalid conversation identifier: must be a valid UUID' });
    return;
  }

  try {
    const result = await query(
      `SELECT id, conversation_id, role, content, citations, model_provider, created_at
       FROM messages
       WHERE conversation_id = $1 AND workspace_id = $2
       ORDER BY created_at ASC`,
      [id, req.workspaceId],
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      error: null,
    });
  } catch (err) {
    logger.error('Failed to list messages', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to load messages',
    });
  }
});

// DELETE /api/v1/chat/conversations/:id
chatRouter.delete('/chat/conversations/:id', authenticate, requireWorkspace, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!UUID_REGEX.test(id)) {
    res.status(400).json({ success: false, data: null, error: 'Invalid conversation identifier: must be a valid UUID' });
    return;
  }

  try {
    const result = await query(
      `DELETE FROM conversations WHERE id = $1 AND workspace_id = $2 RETURNING id`,
      [id, req.workspaceId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Conversation not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id, deleted: true },
      error: null,
    });
  } catch (err) {
    logger.error('Failed to delete conversation', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to delete conversation',
    });
  }
});
