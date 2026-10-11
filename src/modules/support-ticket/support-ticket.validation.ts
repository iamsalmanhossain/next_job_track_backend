import { z } from 'zod';

const createSupportTicket = z.object({
  subject: z.string({ message: 'Subject is required' }).min(3, 'Subject must be at least 3 characters'),
  description: z.string({ message: 'Description is required' }).min(10, 'Description must be at least 10 characters'),
});

export const supportTicketValidation = {
  createSupportTicket,
};

export type TCreateSupportTicket = z.infer<typeof createSupportTicket>;
