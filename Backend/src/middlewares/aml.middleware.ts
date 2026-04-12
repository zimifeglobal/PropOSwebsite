import { Request, Response, NextFunction } from 'express';
import ComplianceLog from '../models/ComplianceLog';
import logger from '../utils/logger';

const AML_THRESHOLD = parseInt(process.env.AML_THRESHOLD || '10000', 10);

/**
 * AML middleware: flags transactions over £10,000 before they are saved.
 * Sets req.body.aml_flagged = true and stores metadata for ComplianceLog creation.
 */
export const amlCheck = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const { amount } = req.body;
  if (typeof amount === 'number' && amount > AML_THRESHOLD) {
    req.body.aml_flagged = true;
    logger.warn(
      `[AML] Transaction of £${amount} exceeds £${AML_THRESHOLD} threshold — flagged for review`
    );
  }
  next();
};

/**
 * Create a ComplianceLog entry after an AML-flagged transaction is persisted.
 */
export const createAmlLog = async (
  transactionId: string,
  portfolioId: string,
  amount: number
): Promise<void> => {
  try {
    await ComplianceLog.create({
      entity_id: transactionId,
      entity_type: 'transaction',
      portfolio_id: portfolioId,
      type: 'AML',
      status: 'flagged',
      metadata: {
        amount,
        currency: 'GBP',
        threshold: AML_THRESHOLD,
        flaggedAt: new Date().toISOString(),
        requiresReview: true,
      },
      last_audit: new Date(),
      notes: `Transaction of £${amount} exceeds AML threshold of £${AML_THRESHOLD}. Manual review required.`,
    });
    logger.info(`[AML] ComplianceLog created for transaction ${transactionId}`);
  } catch (err) {
    logger.error('[AML] Failed to create compliance log', err);
  }
};
