import { Router } from 'express';
import * as ctrl from '../controllers/asset.controller';
import { protect } from '../middlewares/auth.middleware';
import { attachPortfolios } from '../middlewares/scope.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createAssetSchema, updateAssetSchema } from '../schemas/asset.schema';

const router = Router();
router.use(protect, attachPortfolios);

/**
 * @swagger
 * /api/assets:
 *   get:
 *     tags: [Assets]
 *     summary: Get all assets (scoped to user portfolios). Filter by city, property_type, min_esg.
 *   post:
 *     tags: [Assets]
 *     summary: Create a new property asset
 */
router.get('/', ctrl.getAssets);
router.post('/', validate(createAssetSchema), ctrl.createAsset);

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     tags: [Assets]
 *     summary: Get asset by ID
 *   put:
 *     tags: [Assets]
 *     summary: Update asset
 *   delete:
 *     tags: [Assets]
 *     summary: Delete asset
 */
router.get('/:id', ctrl.getAsset);
router.put('/:id', validate(updateAssetSchema), ctrl.updateAsset);
router.delete('/:id', ctrl.deleteAsset);

export default router;
