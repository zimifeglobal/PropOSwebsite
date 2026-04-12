import { Router } from 'express';
import * as ctrl from '../controllers/insurance.controller';
import { protect } from '../middlewares/auth.middleware';
import { attachPortfolios } from '../middlewares/scope.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createInsuranceSchema, quoteRequestSchema } from '../schemas/insurance.schema';

const router = Router();
router.use(protect, attachPortfolios);

/**
 * @swagger
 * /api/insurance/quote:
 *   post:
 *     tags: [Insurance]
 *     summary: Generate insurance premium quote. ESG score >= 70 applies 5% discount.
 */
router.post('/quote', validate(quoteRequestSchema), ctrl.getQuote);

/**
 * @swagger
 * /api/insurance/policies:
 *   get:
 *     tags: [Insurance]
 *     summary: Get policies sorted by expiry date
 *   post:
 *     tags: [Insurance]
 *     summary: Create an insurance policy
 */
router.get('/policies', ctrl.getPolicies);
router.post('/policies', validate(createInsuranceSchema), ctrl.createPolicy);
router.get('/policies/:id', ctrl.getPolicy);
router.put('/policies/:id', ctrl.updatePolicy);

export default router;
