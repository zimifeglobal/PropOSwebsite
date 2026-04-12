import { Request, Response, NextFunction } from 'express';
import Transaction from '../models/Transaction';
import { createAmlLog } from '../middlewares/aml.middleware';
import { reconcileBankEntries } from '../services/reconciliation.service';
import { sendResponse } from '../utils/apiResponse';

export const createTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tx = await Transaction.create(req.body);
    if (tx.aml_flagged) {
      await createAmlLog(tx._id.toString(), tx.portfolio_id.toString(), tx.amount);
    }
    sendResponse(res, { success: true, message: tx.aml_flagged ? 'Transaction created and flagged for AML review.' : 'Transaction created.', data: tx, statusCode: 201 });
  } catch (e) { next(e); }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolioIds = req.portfolioIds || [];
    const filter: Record<string, unknown> = { portfolio_id: { $in: portfolioIds } };
    if (req.query.reconciled !== undefined) filter.reconciled = req.query.reconciled === 'true';
    if (req.query.aml_flagged !== undefined) filter.aml_flagged = req.query.aml_flagged === 'true';
    if (req.query.direction) filter.direction = req.query.direction;
    if (req.query.category) filter.category = req.query.category;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const txs = await Transaction.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit);
    const total = await Transaction.countDocuments(filter);
    sendResponse(res, { success: true, message: 'Transactions fetched.', data: txs, meta: { total, page, limit } });
  } catch (e) { next(e); }
};

export const getTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolioIds = req.portfolioIds || [];
    const tx = await Transaction.findOne({ _id: req.params.id, portfolio_id: { $in: portfolioIds } });
    if (!tx) { res.status(404).json({ success: false, message: 'Transaction not found.' }); return; }
    sendResponse(res, { success: true, message: 'Transaction fetched.', data: tx });
  } catch (e) { next(e); }
};

export const reconcile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { portfolio_id, bank_entries } = req.body;
    const portfolioIds = (req.portfolioIds || []).map(String);
    if (!portfolioIds.includes(portfolio_id)) {
      res.status(403).json({ success: false, message: 'Portfolio not in your account.' }); return;
    }
    const results = await reconcileBankEntries(portfolio_id, bank_entries);
    const autoCount = results.filter((r) => r.auto_reconciled).length;
    sendResponse(res, {
      success: true,
      message: `Reconciliation complete. ${autoCount}/${results.length} entries auto-reconciled.`,
      data: results,
      meta: { total: results.length, auto_reconciled: autoCount },
    });
  } catch (e) { next(e); }
};
