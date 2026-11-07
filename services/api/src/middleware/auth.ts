import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { logger } from './logger';

export interface AuthUser {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      workspaceId?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_testing_only';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      data: null,
      error: 'Authentication required: missing or invalid Bearer token',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };
    next();
  } catch (err) {
    logger.warn('JWT verification failed', { error: (err as Error).message });
    res.status(401).json({
      success: false,
      data: null,
      error: 'Invalid or expired session token',
    });
  }
}

/**
 * Enforces workspace isolation (deny-by-default).
 * Resolves workspaceId from header `x-workspace-id`, query, or body,
 * and validates that the authenticated user is an authorized member.
 */
export async function requireWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  const workspaceId =
    (req.headers['x-workspace-id'] as string) ||
    (req.query.workspaceId as string) ||
    req.body?.workspaceId;

  if (!workspaceId) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Workspace context missing: provide x-workspace-id header or workspaceId parameter',
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      data: null,
      error: 'Authentication required',
    });
    return;
  }

  try {
    const membership = await query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [workspaceId, req.user.userId],
    );

    if (membership.rows.length === 0) {
      logger.warn('Forbidden cross-workspace access attempt', {
        userId: req.user.userId,
        targetWorkspaceId: workspaceId,
      });
      res.status(403).json({
        success: false,
        data: null,
        error: 'Forbidden: access denied to the requested workspace',
      });
      return;
    }

    req.workspaceId = workspaceId;
    next();
  } catch (err) {
    logger.error('Workspace verification database error', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Internal error verifying workspace permissions',
    });
  }
}

