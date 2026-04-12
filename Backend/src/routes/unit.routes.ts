import { Router } from 'express';
import * as ctrl from '../controllers/unit.controller';
import { protect } from '../middlewares/auth.middleware';
import { attachPortfolios } from '../middlewares/scope.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createUnitSchema, updateUnitSchema } from '../schemas/unit.schema';

const router = Router();
router.use(protect, attachPortfolios);

/**
 * @swagger
 * /api/units:
 *   get:
 *     tags: [Units]
 *     summary: Get units (scoped to user assets). Filter by status, asset_id.
 *   post:
 *     tags: [Units]
 *     summary: Create a unit within an asset
 */
router.get('/', ctrl.getUnits);
router.post('/', validate(createUnitSchema), ctrl.createUnit);
router.get('/:id', ctrl.getUnit);
router.put('/:id', validate(updateUnitSchema), ctrl.updateUnit);
router.delete('/:id', ctrl.deleteUnit);

export default router;
