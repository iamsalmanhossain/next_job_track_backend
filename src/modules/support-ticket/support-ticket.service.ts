import prisma from '../../config/prisma.js';
import { AppError } from '../../shared/AppError.js';
import httpStatus from 'http-status';
import type { TCreateSupportTicket } from './support-ticket.validation.js';

const createTicket = async (userId: string, payload: TCreateSupportTicket) => {
  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject: payload.subject,
      description: payload.description,
      status: 'OPEN',
    },
  });

  return ticket;
};

const getMyTickets = async (userId: string, query: any) => {
  const { status } = query;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const whereConditions: any = { userId };
  if (status) {
    whereConditions.status = status;
  }

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.supportTicket.count({ where: whereConditions }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: tickets,
  };
};

const getSingleTicket = async (userId: string, ticketId: string) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket || ticket.userId !== userId) {
    throw new AppError(httpStatus.NOT_FOUND, 'Support ticket not found');
  }

  return ticket;
};

export const supportTicketService = {
  createTicket,
  getMyTickets,
  getSingleTicket,
};
