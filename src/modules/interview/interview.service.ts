import prisma from '../../config/prisma.js';
import { AppError } from '../../shared/AppError.js';
import httpStatus from 'http-status';
import type { TCreateInterview, TUpdateInterview } from './interview.validation.js';
import { calculatePagination } from '../../shared/paginationHelper.js';

const createInterview = async (userId: string, payload: TCreateInterview) => {
  // Check if job application exists and belongs to user
  const jobApp = await prisma.jobApplication.findUnique({
    where: { id: payload.applicationId, userId },
  });

  if (!jobApp) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job application not found');
  }

  const { scheduledAt, ...rest } = payload;

  const result = await prisma.interview.create({
    data: {
      userId,
      ...(rest as any),
      scheduledAt: new Date(scheduledAt),
    },
  });
  return result;
};

const getAllInterviews = async (userId: string, query: any) => {
  const { status, type, applicationId } = query;
  
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(query);

  const whereConditions: any = { userId };
  if (status) whereConditions.status = status;
  if (type) whereConditions.type = type;
  if (applicationId) whereConditions.applicationId = applicationId;

  const result = await prisma.interview.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      jobApplication: {
        select: { companyName: true, jobTitle: true },
      },
    },
  });

  const total = await prisma.interview.count({ where: whereConditions });

  return {
    meta: { page, limit, total },
    data: result,
  };
};

const getSingleInterview = async (userId: string, interviewId: string) => {
  const result = await prisma.interview.findUnique({
    where: { id: interviewId, userId },
    include: {
      jobApplication: {
        select: { companyName: true, jobTitle: true, status: true, appliedAt: true },
      },
    },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Interview not found');
  }

  return result;
};

const updateInterview = async (userId: string, interviewId: string, payload: TUpdateInterview) => {
  const exists = await prisma.interview.findUnique({
    where: { id: interviewId, userId },
  });

  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Interview not found');
  }

  const { scheduledAt, ...rest } = payload;
  const dataToUpdate: any = { ...rest };

  if (scheduledAt !== undefined) {
    dataToUpdate.scheduledAt = new Date(scheduledAt);
  }

  const result = await prisma.interview.update({
    where: { id: interviewId },
    data: dataToUpdate,
  });

  return result;
};

const deleteInterview = async (userId: string, interviewId: string) => {
  const exists = await prisma.interview.findUnique({
    where: { id: interviewId, userId },
  });

  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Interview not found');
  }

  const result = await prisma.interview.delete({
    where: { id: interviewId },
  });

  return result;
};

export const interviewService = {
  createInterview,
  getAllInterviews,
  getSingleInterview,
  updateInterview,
  deleteInterview,
};
