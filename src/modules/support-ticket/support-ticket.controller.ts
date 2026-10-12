import httpStatus from 'http-status';
import { supportTicketService } from './support-ticket.service.js';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import type { Request, Response } from 'express';

const createTicket = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await supportTicketService.createTicket(userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Support ticket submitted successfully',
    data: result,
  });
});

const getMyTickets = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await supportTicketService.getMyTickets(userId, req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Support tickets fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getSingleTicket = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;
  const result = await supportTicketService.getSingleTicket(userId, id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Support ticket fetched successfully',
    data: result,
  });
});

export const supportTicketController = {
  createTicket,
  getMyTickets,
  getSingleTicket,
};
