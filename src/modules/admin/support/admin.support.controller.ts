import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../../shared/catchAsync.js';
import { sendResponse } from '../../../shared/sendResponse.js';
import { adminSupportService } from './admin.support.service.js';

import { DEMO_CONFIG } from '../../../config/demo.js';
import { DEMO_ADMIN_DATA } from '../../../config/demoAdminData.js';

const getAllTickets = catchAsync(async (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  if (currentUser?.email?.toLowerCase() === DEMO_CONFIG.ADMIN_EMAIL.toLowerCase()) {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Support tickets retrieved successfully (Demo View)',
      meta: {
        page: 1,
        limit: 15,
        total: DEMO_ADMIN_DATA.supportTickets.length,
      },
      data: DEMO_ADMIN_DATA.supportTickets,
    });
  }

  const result = await adminSupportService.getAllTickets(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Support tickets retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const updateTicketStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  
  const result = await adminSupportService.updateTicketStatus(id, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Support ticket marked as ${status}`,
    data: result,
  });
});

export const adminSupportController = {
  getAllTickets,
  updateTicketStatus,
};
