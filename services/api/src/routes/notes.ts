import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, requireWorkspace } from '../middleware/auth';
import { logger } from '../middleware/logger';

export const notesRouter: Router = Router();

const createNoteSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(255),
  body: z.string().default(''),
  linkedDocumentIds: z.array(z.string().uuid()).optional(),
});

const updateNoteSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(255).optional(),
  body: z.string().optional(),
  linkedDocumentIds: z.array(z.string().uuid()).optional(),
});

// GET /api/v1/notes
notesRouter.get('/notes', authenticate, requireWorkspace, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, workspace_id, user_id, title, body, linked_document_ids, created_at, updated_at
       FROM notes
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
    logger.error('Failed to list notes', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve notes',
    });
  }
});

// POST /api/v1/notes
notesRouter.post('/notes', authenticate, requireWorkspace, async (req: Request, res: Response) => {
  const parseResult = createNoteSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      data: null,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
    });
    return;
  }

  const { title, body, linkedDocumentIds } = parseResult.data;

  try {
    const result = await query(
      `INSERT INTO notes (workspace_id, user_id, title, body, linked_document_ids)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, workspace_id, user_id, title, body, linked_document_ids, created_at, updated_at`,
      [req.workspaceId, req.user!.userId, title, body, linkedDocumentIds || []],
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      error: null,
    });
  } catch (err) {
    logger.error('Failed to create note', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to create note',
    });
  }
});

// GET /api/v1/notes/:id
notesRouter.get('/notes/:id', authenticate, requireWorkspace, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await query(
      `SELECT id, workspace_id, user_id, title, body, linked_document_ids, created_at, updated_at
       FROM notes
       WHERE id = $1 AND workspace_id = $2`,
      [id, req.workspaceId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Note not found in this workspace',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
      error: null,
    });
  } catch (err) {
    logger.error('Failed to get note', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve note',
    });
  }
});

// PUT /api/v1/notes/:id
notesRouter.put('/notes/:id', authenticate, requireWorkspace, async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseResult = updateNoteSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      data: null,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
    });
    return;
  }

  const { title, body, linkedDocumentIds } = parseResult.data;

  try {
    // Check ownership and workspace scope
    const existing = await query(
      `SELECT id, title, body, linked_document_ids FROM notes WHERE id = $1 AND workspace_id = $2`,
      [id, req.workspaceId],
    );

    if (existing.rows.length === 0) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Note not found in this workspace',
      });
      return;
    }

    const current = existing.rows[0];
    const newTitle = title !== undefined ? title : current.title;
    const newBody = body !== undefined ? body : current.body;
    const newLinked = linkedDocumentIds !== undefined ? linkedDocumentIds : current.linked_document_ids;

    const result = await query(
      `UPDATE notes
       SET title = $1, body = $2, linked_document_ids = $3, updated_at = NOW()
       WHERE id = $4 AND workspace_id = $5
       RETURNING id, workspace_id, user_id, title, body, linked_document_ids, created_at, updated_at`,
      [newTitle, newBody, newLinked, id, req.workspaceId],
    );

    res.status(200).json({
      success: true,
      data: result.rows[0],
      error: null,
    });
  } catch (err) {
    logger.error('Failed to update note', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to update note',
    });
  }
});

// DELETE /api/v1/notes/:id
notesRouter.delete('/notes/:id', authenticate, requireWorkspace, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await query(
      `DELETE FROM notes
       WHERE id = $1 AND workspace_id = $2
       RETURNING id`,
      [id, req.workspaceId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Note not found in this workspace',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id, deleted: true },
      error: null,
    });
  } catch (err) {
    logger.error('Failed to delete note', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to delete note',
    });
  }
});
