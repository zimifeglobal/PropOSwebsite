import { Router } from 'express';
import * as ctrl from '../controllers/compliance.controller';
import { protect, authorize } from '../middlewares/auth.middleware';
import { attachPortfolios } from '../middlewares/scope.middleware';

const router = Router();
router.use(protect, attachPortfolios);

/**
 * @swagger
 * /api/compliance/audit-status:
 *   get:
 *     tags: [Compliance]
 *     summary: Get aggregated compliance audit status across all portfolios
 */
router.get('/audit-status', ctrl.getAuditStatus);

/**
 * @swagger
 * /api/compliance/logs:
 *   get:
 *     tags: [Compliance]
 *     summary: Get paginated compliance logs. Filter by type, status.
 *   post:
 *     tags: [Compliance]
 *     summary: Create a compliance log entry (admin/manager only)
 */
router.get('/logs', ctrl.getLogs);
router.post('/logs', authorize('admin', 'manager'), ctrl.createLog);

/**
 * @swagger
 * /api/compliance/logs/{id}:
 *   patch:
 *     tags: [Compliance]
 *     summary: Update compliance log status (admin/manager only)
 */
router.patch('/logs/:id', authorize('admin', 'manager'), ctrl.updateLog);

export default router;
