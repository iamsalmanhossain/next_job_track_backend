import { z } from 'zod';

const createJobApplication = z.object({
    resumeId: z.string().optional(),
    companyName: z.string({ message: 'Company name is required' }).min(1),
    companyLogo: z.string().optional(),
    jobTitle: z.string({ message: 'Job title is required' }).min(1),
    jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE", "REMOTE"]).optional(),
    location: z.string().optional(),
    isRemote: z.boolean().optional(),
    salaryMin: z.number().positive().optional(),
    salaryMax: z.number().positive().optional(),
    salaryCurrency: z.string().optional(),
    jobUrl: z.string().url().optional(),
    source: z.enum(['LINKEDIN', 'INDEED', 'BDJOBS', 'COMPANY_WEBSITE', 'REFERRAL', 'FACEBOOK', 'OTHER']).optional(),
    status: z.enum(['WISHLIST', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    isFavorite: z.boolean().optional(),
    description: z.string().optional(),
    requirements: z.string().optional(),
    appliedAt: z.string().nullable().optional(),
    deadline: z.string().nullable().optional(),
});

const updateJobApplication = z.object({
    resumeId: z.string().optional(),
    companyName: z.string().min(1).optional(),
    companyLogo: z.string().optional(),
    jobTitle: z.string().min(1).optional(),
    jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE', 'REMOTE']).optional(),
    location: z.string().optional(),
    isRemote: z.boolean().optional(),
    salaryMin: z.number().positive().optional(),
    salaryMax: z.number().positive().optional(),
    salaryCurrency: z.string().optional(),
    jobUrl: z.string().optional(),
    source: z.enum(['LINKEDIN', 'INDEED', 'BDJOBS', 'COMPANY_WEBSITE', 'REFERRAL', 'FACEBOOK', 'OTHER']).optional(),
    status: z.enum(['WISHLIST', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    isFavorite: z.boolean().optional(),
    description: z.string().optional(),
    requirements: z.string().optional(),
    appliedAt: z.string().nullable().optional(),
    deadline: z.string().nullable().optional(),
});

export const jobApplicationValidation = {
  createJobApplication,
  updateJobApplication,
};

export type TCreateJobApplication = z.infer<typeof createJobApplication>
export type TUpdateJobApplication = z.infer<typeof updateJobApplication>

