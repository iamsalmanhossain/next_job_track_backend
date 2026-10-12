import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../../shared/catchAsync.js';
import { sendResponse } from '../../../shared/sendResponse.js';
import { userService } from './admin.user.service.js';

import { DEMO_CONFIG } from '../../../config/demo.js';
import { DEMO_ADMIN_DATA } from '../../../config/demoAdminData.js';

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  if (currentUser?.email?.toLowerCase() === DEMO_CONFIG.ADMIN_EMAIL.toLowerCase()) {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Users retrieved successfully (Demo View)',
      meta: {
        page: 1,
        limit: 10,
        total: DEMO_ADMIN_DATA.users.length,
      },
      data: DEMO_ADMIN_DATA.users,
    });
  }

  // Force role to USER
  const result = await userService.getAllUsers({ ...req.query, role: 'USER' });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  if (currentUser?.email?.toLowerCase() === DEMO_CONFIG.ADMIN_EMAIL.toLowerCase()) {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Admins retrieved successfully (Demo View)',
      meta: {
        page: 1,
        limit: 10,
        total: DEMO_ADMIN_DATA.admins.length,
      },
      data: DEMO_ADMIN_DATA.admins,
    });
  }

  // Force role to ADMIN
  const result = await userService.getAllUsers({ ...req.query, role: 'ADMIN' });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admins retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const changeUserStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  const result = await userService.changeUserStatus(id, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User status changed to ${status}`,
    data: result,
  });
});

const changeUserRole = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { role } = req.body;
  const result = await userService.changeUserRole(id, role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User role changed to ${role}`,
    data: result,
  });
});

export const userController = {
  getAllUsers,
  getAllAdmins,
  changeUserStatus,
  changeUserRole,
};
