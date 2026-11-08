import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { query } from '../db';
import { authenticate, requireWorkspace } from '../middleware/auth';
import { logger } from '../middleware/logger';
import { ingestDocument, deleteDocumentChunks } from '../services/aiClient';

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
      error: 'No file uploaded or file rejected by format filter',
    });
    return;
  }

  const { path: diskPath, originalname, mimetype, size } = req.file;

  try {
    const hash = await new Promise<string>((resolve, reject) => {
      const hashStream = crypto.createHash('sha256');
      const fileStream = fs.createReadStream(diskPath);
      fileStream.on('error', reject);
      hashStream.on('error', reject);
      fileStream.pipe(hashStream).on('finish', () => resolve(hashStream.digest('hex')));
    });

    const result = await query(
      `INSERT INTO documents (workspace_id, user_id, filename, mime_type, size_bytes, storage_path, hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id, workspace_id, filename, mime_type, size_bytes, hash, status, created_at`,
      [req.workspaceId, req.user!.userId, originalname, mimetype, size, diskPath, hash],
    );

    const doc = result.rows[0];
    logger.info(`File uploaded: ${originalname} (${size} bytes) in workspace ${req.workspaceId}`);

    // Asynchronously trigger AI service ingestion to parse, chunk, embed, and index
    ingestDocument({
      documentId: doc.id,
      workspaceId: req.workspaceId!,
      filePath: diskPath,
      filename: originalname,
      mimeType: mimetype,
    }).then(async (ingestResult) => {
      if (ingestResult.status === 'indexed') {
        await query(
          `UPDATE documents SET status = 'indexed', updated_at = NOW() WHERE id = $1`,
          [doc.id],
        );
        logger.info(`Document successfully indexed in ChromaDB: ${doc.id}`);
      } else {
        await query(
          `UPDATE documents SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2`,
          [ingestResult.errorMessage || 'Unknown indexing error', doc.id],
        );
        logger.warn(`Document indexing failed: ${doc.id} - ${ingestResult.errorMessage}`);
      }
    }).catch(async (err) => {
      logger.error(`Error during document ingestion background task: ${doc.id}`, err);
      await query(
        `UPDATE documents SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2`,
        [(err as Error).message || 'Background ingestion process failed', doc.id],
      ).catch((dbErr) => logger.error('Failed to record ingestion error in db', dbErr));
    });

    res.status(201).json({
      success: true,
      data: doc,
      error: null,
    });
  } catch (err) {
    logger.error('Failed to register uploaded file in database', err);
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

// POST /api/v1/files/:id/reindex
uploadRouter.post('/files/:id/reindex', authenticate, requireWorkspace, async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const docRes = await query(
      `SELECT id, workspace_id, filename, mime_type, storage_path FROM documents WHERE id = $1 AND workspace_id = $2`,
      [id, req.workspaceId],
    );

    if (docRes.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Document not found' });
      return;
    }

    const doc = docRes.rows[0];
    await query(`UPDATE documents SET status = 'pending', error_message = NULL WHERE id = $1`, [id]);

    const ingestResult = await ingestDocument({
      documentId: doc.id,
      workspaceId: doc.workspace_id,
      filePath: doc.storage_path,
      filename: doc.filename,
      mimeType: doc.mime_type,
    });

    const newStatus = ingestResult.status === 'indexed' ? 'indexed' : 'failed';
    await query(
      `UPDATE documents SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3`,
      [newStatus, ingestResult.errorMessage || null, id],
    );

    res.status(200).json({
      success: true,
      data: { id, status: newStatus, chunksIndexed: ingestResult.chunksIndexed },
      error: null,
    });
  } catch (err) {
    logger.error('Failed to reindex document', err);
    res.status(500).json({ success: false, data: null, error: 'Failed to reindex document' });
  }
});

// DELETE /api/v1/files/:id
uploadRouter.delete('/files/:id', authenticate, requireWorkspace, async (req: Request, res: Response) => {
  const id = req.params.id as string;

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

    // Purge vectors from ChromaDB in background
    deleteDocumentChunks(req.workspaceId!, id);

    // Delete database record
    await query(`DELETE FROM documents WHERE id = $1 AND workspace_id = $2`, [id, req.workspaceId]);

    // Delete local disk file within workspace directory boundaries
    if (storage_path) {
      const resolvedPath = path.resolve(storage_path);
      const expectedDir = path.resolve(UPLOAD_ROOT, req.workspaceId!);
      if (resolvedPath.startsWith(expectedDir + path.sep)) {
        if (fs.existsSync(resolvedPath)) {
          try {
            fs.unlinkSync(resolvedPath);
          } catch (e) {
            logger.warn('Failed to delete physical file from disk', { path: resolvedPath, error: e });
          }
        }
      } else {
        logger.warn('Security alert: storage_path outside workspace upload folder', {
          storage_path,
          workspaceId: req.workspaceId,
        });
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
