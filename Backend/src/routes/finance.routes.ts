import { Router } from 'express';
import * as ctrl from '../controllers/finance.controller';
import { protect } from '../middlewares/auth.middleware';
import { attachPortfolios } from '../middlewares/scope.middleware';
import { amlCheck } from '../middlewares/aml.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createTransactionSchema, reconcileSchema } from '../schemas/transaction.schema';

const router = Router();
router.use(protect, attachPortfolios);

/**
 * @swagger
 * /api/finance/transactions:
 *   get:
 *     tags: [Finance]
 *     summary: Get transactions. Filter by reconciled, aml_flagged, direction, category, page, limit.
 *   post:
 *     tags: [Finance]
 *     summary: Create transaction. Amounts > £10,000 are auto-flagged for AML review.
 */
router.get('/transactions', ctrl.getTransactions);
router.post('/transactions', validate(createTransactionSchema), amlCheck, ctrl.createTransaction);
router.get('/transactions/:id', ctrl.getTransaction);

/**
 * @swagger
 * /api/finance/reconciliation:
 *   post:
 *     tags: [Finance]
 *     summary: AI-driven rent reconciliation — fuzzy-match bank entries to tenancy references
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               portfolio_id: { type: string }
 *               bank_entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     amount: { type: number }
 *                     bank_ref: { type: string }
 */
router.post('/reconciliation', validate(reconcileSchema), ctrl.reconcile);

export default router;
