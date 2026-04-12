import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes';
import portfolioRoutes from './portfolio.routes';
import assetRoutes from './asset.routes';
import unitRoutes from './unit.routes';
import tenancyRoutes from './tenancy.routes';
import complianceRoutes from './compliance.routes';
import financeRoutes from './finance.routes';
import insuranceRoutes from './insurance.routes';

const router = Router();

// ─── Health ────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Auth]
 *     summary: API health check
 *     security: []
 */
router.get('/health', (_req, res) => {
  const dbStates: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    success: true,
    message: 'PropOS Enterprise API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    database: { status: dbStates[mongoose.connection.readyState], name: process.env.DB_NAME },
    timestamp: new Date().toISOString(),
  });
});

// ─── API routes ────────────────────────────────────────────────────
router.use('/auth',       authRoutes);
router.use('/portfolios', portfolioRoutes);
router.use('/assets',     assetRoutes);
router.use('/units',      unitRoutes);
router.use('/tenancies',  tenancyRoutes);
router.use('/compliance', complianceRoutes);
router.use('/finance',    financeRoutes);
router.use('/insurance',  insuranceRoutes);

export default router;
