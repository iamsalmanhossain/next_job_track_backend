import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../../shared/catchAsync.js';
import { sendResponse } from '../../../shared/sendResponse.js';
import { adminDashboardService } from './admin.dashboard.service.js';

import { DEMO_CONFIG } from '../../../config/demo.js';
import { DEMO_ADMIN_DATA } from '../../../config/demoAdminData.js';

const getGlobalDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user?.email?.toLowerCase() === DEMO_CONFIG.ADMIN_EMAIL.toLowerCase()) {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Global dashboard stats retrieved successfully (Demo View)',
      data: DEMO_ADMIN_DATA.stats,
    });
  }

  const result = await adminDashboardService.getGlobalDashboardStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Global dashboard stats retrieved successfully',
    data: result,
  });
});

export const adminDashboardController = {
  getGlobalDashboardStats,
};
