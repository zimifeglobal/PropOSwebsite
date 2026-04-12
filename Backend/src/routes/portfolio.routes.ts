import { Router } from 'express';
import * as ctrl from '../controllers/portfolio.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createPortfolioSchema, updatePortfolioSchema } from '../schemas/portfolio.schema';

const router = Router();
router.use(protect);

/**
 * @swagger
 * /api/portfolios:
 *   get:
 *     tags: [Portfolios]
 *     summary: Get all portfolios for authenticated user
 *   post:
 *     tags: [Portfolios]
 *     summary: Create a new portfolio
 */
router.get('/', ctrl.getPortfolios);
router.post('/', validate(createPortfolioSchema), ctrl.createPortfolio);

/**
 * @swagger
 * /api/portfolios/{id}:
 *   get:
 *     tags: [Portfolios]
 *     summary: Get portfolio by ID
 *   put:
 *     tags: [Portfolios]
 *     summary: Update portfolio
 *   delete:
 *     tags: [Portfolios]
 *     summary: Delete portfolio
 */
router.get('/:id', ctrl.getPortfolio);
router.put('/:id', validate(updatePortfolioSchema), ctrl.updatePortfolio);
router.delete('/:id', ctrl.deletePortfolio);

export default router;
