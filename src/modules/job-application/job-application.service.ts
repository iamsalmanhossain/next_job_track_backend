import prisma from '../../config/prisma.js';
import { AppError } from '../../shared/AppError.js';
import httpStatus from 'http-status';
import { calculatePagination } from '../../shared/paginationHelper.js';
import type { TCreateJobApplication, TUpdateJobApplication } from './job-application.validation.js';

const parseDate = (val?: string | null) => {
  if (!val || typeof val !== 'string' || !val.trim()) return undefined;
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

const parseDateForUpdate = (val?: string | null) => {
  if (val === undefined) return undefined;
  if (!val || (typeof val === 'string' && !val.trim())) return null;
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const createJobApplication = async (userId: string, payload: TCreateJobApplication) => {
  const { appliedAt, deadline, ...rest } = payload;

  const result = await prisma.jobApplication.create({
    data: {
      userId,
      ...(rest as any),
      appliedAt: parseDate(appliedAt),
      deadline: parseDate(deadline),
    },
  });
  return result;
};

const getAllJobApplications = async (userId: string, query: any) => {
  const { status, priority, source, isFavorite, searchTerm } = query;

  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(query);

  const whereConditions: any = {
    userId,
  };

  if (status) whereConditions.status = status;
  if (priority) whereConditions.priority = priority;
  if (source) whereConditions.source = source;
  if (isFavorite !== undefined) whereConditions.isFavorite = isFavorite === 'true';

  if (searchTerm) {
    whereConditions.OR = [
      { companyName: { contains: searchTerm, mode: 'insensitive' } },
      { jobTitle: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  const result = await prisma.jobApplication.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    select: {
      id: true,
      companyName: true,
      companyLogo: true,
      jobTitle: true,
      jobType: true,
      location: true,
      status: true,
      priority: true,
      isFavorite: true,
      appliedAt: true,
      jobUrl: true,
    }
  });

  const total = await prisma.jobApplication.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getSingleJobApplication = async (userId: string, applicationId: string) => {
  const result = await prisma.jobApplication.findUnique({
    where: {
      id: applicationId,
      userId,
    },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job application not found');
  }

  return result;
};

const updateJobApplication = async (userId: string, applicationId: string, payload: TUpdateJobApplication) => {
  // Ensure the application exists and belongs to the user
  const exists = await prisma.jobApplication.findUnique({
    where: { id: applicationId, userId },
  });

  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job application not found');
  }

  const { appliedAt, deadline, ...rest } = payload;
  const updateData: any = { ...rest };

  if (appliedAt !== undefined) {
    updateData.appliedAt = parseDateForUpdate(appliedAt);
  }

  if (deadline !== undefined) {
    updateData.deadline = parseDateForUpdate(deadline);
  }

  const result = await prisma.jobApplication.update({
    where: {
      id: applicationId,
    },
    data: updateData,
  });

  return result;
};

const deleteJobApplication = async (userId: string, applicationId: string) => {
  // Ensure the application exists and belongs to the user
  const exists = await prisma.jobApplication.findUnique({
    where: { id: applicationId, userId },
  });

  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job application not found');
  }

  const result = await prisma.jobApplication.delete({
    where: {
      id: applicationId,
    },
  });

  return result;
};

const getJobApplicationStats = async (userId: string) => {
  const stats = await prisma.jobApplication.groupBy({
    by: ['status'],
    where: { userId },
    _count: {
      _all: true,
    },
  });

  const totalApplications = await prisma.jobApplication.count({ where: { userId } });

  let applied = 0, screening = 0, interview = 0, offer = 0, rejected = 0;

  stats.forEach((stat) => {
    if (stat.status === 'APPLIED') applied = stat._count._all;
    if (stat.status === 'SCREENING') screening = stat._count._all;
    if (stat.status === 'INTERVIEW') interview = stat._count._all;
    if (stat.status === 'OFFER') offer = stat._count._all;
    if (stat.status === 'REJECTED') rejected = stat._count._all;
  });

  // Active Pipeline: applications that are currently in progress
  const activePipeline = applied + screening + interview;

  // Interview Rate: percentage of total tracked applications that reached interview
  const interviewRate = totalApplications > 0 ? ((interview / totalApplications) * 100).toFixed(1) + '%' : '0.0%';

  return {
    totalApplications,
    applied,
    screening,
    interview,
    offer,
    rejected,
    activePipeline,
    interviewRate,
  };
};

export const jobApplicationService = {
  createJobApplication,
  getAllJobApplications,
  getSingleJobApplication,
  updateJobApplication,
  deleteJobApplication,
  getJobApplicationStats,
};
