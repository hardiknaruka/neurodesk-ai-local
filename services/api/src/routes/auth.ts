import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db';
import { authenticate } from '../middleware/auth';
import { logger } from '../middleware/logger';

export const authRouter: Router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_testing_only';
const JWT_EXPIRY: jwt.SignOptions['expiresIn'] = (process.env.JWT_EXPIRY || '15m') as jwt.SignOptions['expiresIn'];

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  displayName: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/v1/auth/register
authRouter.post('/auth/register', async (req: Request, res: Response) => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      data: null,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
    });
    return;
  }

  const { email, password, displayName } = parseResult.data;

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      res.status(409).json({
        success: false,
        data: null,
        error: 'An account with this email already exists',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name, created_at`,
      [email.toLowerCase(), passwordHash, displayName || email.split('@')[0]],
    );
    const user = userResult.rows[0];

    // Create default personal workspace
    const workspaceResult = await query(
      `INSERT INTO workspaces (owner_id, name)
       VALUES ($1, $2)
       RETURNING id, name, created_at`,
      [user.id, 'Personal Workspace'],
    );
    const workspace = workspaceResult.rows[0];

    // Add membership
    await query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [workspace.id, user.id],
    );

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    logger.info(`User registered successfully: ${user.email}`);

    res.status(201).json({
      success: true,
      data: {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          createdAt: user.created_at,
        },
        workspace: {
          id: workspace.id,
          name: workspace.name,
        },
      },
      error: null,
    });
  } catch (err) {
    logger.error('Registration failed with database error', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error during registration',
    });
  }
});

// POST /api/v1/auth/login
authRouter.post('/auth/login', async (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      data: null,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
    });
    return;
  }

  const { email, password } = parseResult.data;

  try {
    const userResult = await query(
      `SELECT id, email, password_hash, display_name, created_at
       FROM users WHERE email = $1`,
      [email.toLowerCase()],
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid email or password',
      });
      return;
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid email or password',
      });
      return;
    }

    // Fetch primary workspace
    const workspaceResult = await query(
      `SELECT w.id, w.name, wm.role
       FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id = w.id
       WHERE wm.user_id = $1
       ORDER BY w.created_at ASC
       LIMIT 1`,
      [user.id],
    );
    const workspace = workspaceResult.rows[0] || null;

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          createdAt: user.created_at,
        },
        workspace,
      },
      error: null,
    });
  } catch (err) {
    logger.error('Login database error', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error during login',
    });
  }
});

// GET /api/v1/auth/me
authRouter.get('/auth/me', authenticate, async (req: Request, res: Response) => {
  try {
    const userResult = await query(
      `SELECT id, email, display_name, created_at FROM users WHERE id = $1`,
      [req.user!.userId],
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'User not found',
      });
      return;
    }

    const workspacesResult = await query(
      `SELECT w.id, w.name, wm.role, w.created_at
       FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id = w.id
       WHERE wm.user_id = $1
       ORDER BY w.created_at ASC`,
      [req.user!.userId],
    );

    res.status(200).json({
      success: true,
      data: {
        user: userResult.rows[0],
        workspaces: workspacesResult.rows,
      },
      error: null,
    });
  } catch (err) {
    logger.error('Fetch me error', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error',
    });
  }
});
