import type { Request, Response, NextFunction } from 'express';
import { isDemoEmail } from '../config/demo.js';
import { sendResponse } from '../shared/sendResponse.js';
import httpStatus from 'http-status';

/**
 * Middleware that blocks database write operations (POST, PUT, PATCH, DELETE)
 * for demo accounts (Demo User & Demo Admin).
 * Instead of rejecting with an error, it returns a 200/201 simulated success response
 * with a mock payload so the frontend updates smoothly without altering database state!
 */
export const demoReadOnlyGuard = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  // If request is GET or not a demo user, let it proceed normally to the DB
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || !user || !isDemoEmail(user.email)) {
    return next();
  }

  // Handle write attempts (POST, PATCH, PUT, DELETE) by Demo User / Admin
  console.log(`🛡️ [Demo Guard] Mocking ${req.method} request on ${req.originalUrl} for demo account: ${user.email}`);

  // 1. DELETE operations: Return simulated success
  if (req.method === 'DELETE') {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Demo mode: Action simulated successfully (database unchanged).',
      data: null,
    });
  }

  // 2. PATCH / PUT operations: Return body merged with simulated ID and timestamps
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const id = req.params?.id || req.body?.id || 'demo-simulated-id';
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Demo mode: Changes simulated successfully (database unchanged).',
      data: {
        id,
        ...req.body,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  // 3. POST operations: Return created mock entity
  if (req.method === 'POST') {
    return sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Demo mode: Creation simulated successfully (database unchanged).',
      data: {
        id: `demo-${Date.now()}`,
        userId: user.id,
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }

  return next();
};
