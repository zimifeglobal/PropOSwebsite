import { Router } from 'express';
import * as ctrl from '../controllers/tenancy.controller';
import { protect } from '../middlewares/auth.middleware';
import { attachPortfolios } from '../middlewares/scope.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createTenancySchema, updateTenancySchema } from '../schemas/tenancy.schema';

const router = Router();
router.use(protect, attachPortfolios);

/**
 * @swagger
 * /api/tenancies:
 *   get:
 *     tags: [Tenancies]
 *     summary: Get tenancies scoped to user portfolio
 *   post:
 *     tags: [Tenancies]
 *     summary: Create a tenancy/lease record
 */
router.get('/', ctrl.getTenancies);
router.post('/', validate(createTenancySchema), ctrl.createTenancy);
router.get('/:id', ctrl.getTenancy);
router.put('/:id', validate(updateTenancySchema), ctrl.updateTenancy);

/**
 * @swagger
 * /api/tenancies/{id}/lease:
 *   get:
 *     tags: [Tenancies]
 *     summary: Generate PDF lease agreement for a tenancy
 *     produces: [application/pdf]
 */
router.get('/:id/lease', ctrl.generateLease);

export default router;
