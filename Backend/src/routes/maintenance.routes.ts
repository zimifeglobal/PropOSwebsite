import { Router } from 'express';
import * as ctrl from '../controllers/maintenance.controller';
import { protect, authorize } from '../middlewares/auth.middleware';
import { attachPortfolios } from '../middlewares/scope.middleware';
import { validate } from '../middlewares/validate.middleware';
import { assignTechnicianSchema, createMaintenanceTicketSchema } from '../schemas/maintenance.schema';

const router = Router();
router.use(protect, attachPortfolios);

router.get('/stream', ctrl.streamMaintenanceEvents);
router.post('/tickets', validate(createMaintenanceTicketSchema), ctrl.createTicket);
router.get('/tickets', ctrl.listTickets);
router.patch(
  '/tickets/:id/assign',
  authorize('manager', 'admin'),
  validate(assignTechnicianSchema),
  ctrl.assignTechnician
);

export default router;
