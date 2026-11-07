import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { query } from '../db';
import { authenticate, requireWorkspace } from '../middleware/auth';
import { logger } from '../middleware/logger';

export const uploadRouter: Router = Router();

const UPLOAD_ROOT = path.resolve(process.env.FILE_UPLOAD_PATH || './data-local/uploads');
const MAX_SIZE_MB = Number(process.env.FILE_MAX_SIZE_MB) || 50;

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.md', '.png', '.jpg', '.jpeg']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'image/png',
  'image/jpeg',
]);

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const workspaceId = req.workspaceId || 'common';
    const targetDir = path.join(UPLOAD_ROOT, workspaceId);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error(`Unsupported file type: ${ext}. Allowed: PDF, DOCX, TXT, MD, PNG, JPG`));
    }
    cb(null, true);
  },
});

// POST /api/v1/upload
uploadRouter.post('/upload', authenticate, requireWorkspace, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'No file uploaded or file rejected by validator',
    });
    return;
  }

  const { originalname, mimetype, size, path: diskPath } = req.file;

  try {
    // Compute SHA-256 hash of uploaded content
    const fileBuffer = fs.readFileSync(diskPath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const result = await query(
      `INSERT INTO documents (workspace_id, user_id, filename, mime_type, size_bytes, storage_path, hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id, workspace_id, filename, mime_type, size_bytes, hash, status, created_at`,
      [req.workspaceId, req.user!.userId, originalname, mimetype, size, diskPath, hash],
    );

    logger.info(`File uploaded: ${originalname} (${size} bytes) in workspace ${req.workspaceId}`);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      error: null,
    });
  } catch (err) {
    logger.error('Failed to register uploaded file in database', err);
    // Cleanup temporary file on error
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to record uploaded document metadata',
    });
  }
});

// GET /api/v1/files
uploadRouter.get('/files', authenticate, requireWorkspace, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, workspace_id, filename, mime_type, size_bytes, hash, status, error_message, created_at, updated_at
       FROM documents
       WHERE workspace_id = $1
       ORDER BY created_at DESC`,
      [req.workspaceId],
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      error: null,
    });
  } catch (err) {
    logger.error('Failed to list workspace documents', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to list documents',
    });
  }
});

// DELETE /api/v1/files/:id
uploadRouter.delete('/files/:id', authenticate, requireWorkspace, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const fetchResult = await query(
      `SELECT id, storage_path FROM documents WHERE id = $1 AND workspace_id = $2`,
      [id, req.workspaceId],
    );

    if (fetchResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Document not found in this workspace',
      });
      return;
    }

    const { storage_path } = fetchResult.rows[0];

    // Delete record
    await query(`DELETE FROM documents WHERE id = $1 AND workspace_id = $2`, [id, req.workspaceId]);

    // Delete local disk file
    if (storage_path && fs.existsSync(storage_path)) {
      try {
        fs.unlinkSync(storage_path);
      } catch (e) {
        logger.warn('Failed to delete physical file from disk', { path: storage_path, error: e });
      }
    }

    res.status(200).json({
      success: true,
      data: { id, deleted: true },
      error: null,
    });
  } catch (err) {
    logger.error('Failed to delete document', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to delete document',
    });
  }
});
