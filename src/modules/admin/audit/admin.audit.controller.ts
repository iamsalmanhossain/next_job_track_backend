import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../../shared/catchAsync.js';
import { sendResponse } from '../../../shared/sendResponse.js';
import { adminAuditService } from './admin.audit.service.js';

import { DEMO_CONFIG } from '../../../config/demo.js';
import { DEMO_ADMIN_DATA } from '../../../config/demoAdminData.js';

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  if (currentUser?.email?.toLowerCase() === DEMO_CONFIG.ADMIN_EMAIL.toLowerCase()) {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Audit logs retrieved successfully (Demo View)',
      meta: {
        page: 1,
        limit: 20,
        total: DEMO_ADMIN_DATA.auditLogs.length,
      },
      data: DEMO_ADMIN_DATA.auditLogs,
    });
  }

  const result = await adminAuditService.getAuditLogs(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Audit logs retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const adminAuditController = {
  getAuditLogs,
};
