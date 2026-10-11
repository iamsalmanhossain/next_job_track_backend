import express, { Router } from 'express';
import { supportTicketController } from './support-ticket.controller.js';
import { auth } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { supportTicketValidation } from './support-ticket.validation.js';

const router: Router = express.Router();

router.post(
  '/',
  auth(),
  validateRequest(supportTicketValidation.createSupportTicket),
  supportTicketController.createTicket
);

router.get(
  '/my-tickets',
  auth(),
  supportTicketController.getMyTickets
);

router.get(
  '/:id',
  auth(),
  supportTicketController.getSingleTicket
);

export const supportTicketRoutes = router;
