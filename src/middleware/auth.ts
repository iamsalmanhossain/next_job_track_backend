import {  type NextFunction, type Request, type Response,  } from 'express';
import httpStatus from 'http-status';
import { AppError } from '../shared/AppError.js';
import { verifyToken } from '../modules/auth/auth.utils.js';
import { env } from '../config/env.js';
import prisma from '../config/prisma.js';
import type { Role } from '@prisma/client';
import { demoReadOnlyGuard } from './demoGuard.js';

export const auth = (...requiredRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1] || authHeader;

      if (!token) {
        throw AppError(httpStatus.UNAUTHORIZED, 'You are not logged in. Please provide a valid token.');
      }

      const decoded = verifyToken(token, env.JWT_SECRET) as any;

      // Verify user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw AppError(httpStatus.UNAUTHORIZED, 'User no longer exists.');
      }

      if (user.isDeleted) {
        throw AppError(httpStatus.FORBIDDEN, 'Your account has been deleted.');
      }

      if (user.status !== 'ACTIVE') {
        throw AppError(httpStatus.FORBIDDEN, `Your account is ${user.status.toLowerCase()}.`);
      }

      // Check roles if required
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        throw AppError(httpStatus.FORBIDDEN, 'You do not have permission to access this route.');
      }

      // Attach user to request
      (req as any).user = user;

      // Guard demo accounts against modifying the actual database
      demoReadOnlyGuard(req, res, next);
    } catch (error: any) {
      next(AppError(error.statusCode || httpStatus.UNAUTHORIZED, error.message || 'Unauthorized'));
    }
  };
};
