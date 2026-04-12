import { Request, Response, NextFunction } from 'express';
import Portfolio from '../models/Portfolio';
import { sendResponse } from '../utils/apiResponse';

export const createPortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolio = await Portfolio.create({ ...req.body, owner_id: req.user!._id });
    sendResponse(res, { success: true, message: 'Portfolio created.', data: portfolio, statusCode: 201 });
  } catch (e) { next(e); }
};

export const getPortfolios = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolios = await Portfolio.find({ owner_id: req.user!._id }).sort({ createdAt: -1 });
    sendResponse(res, { success: true, message: 'Portfolios fetched.', data: portfolios, meta: { total: portfolios.length } });
  } catch (e) { next(e); }
};

export const getPortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolio = await Portfolio.findOne({ _id: req.params.id, owner_id: req.user!._id });
    if (!portfolio) { res.status(404).json({ success: false, message: 'Portfolio not found.' }); return; }
    sendResponse(res, { success: true, message: 'Portfolio fetched.', data: portfolio });
  } catch (e) { next(e); }
};

export const updatePortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      { _id: req.params.id, owner_id: req.user!._id },
      req.body, { new: true, runValidators: true }
    );
    if (!portfolio) { res.status(404).json({ success: false, message: 'Portfolio not found.' }); return; }
    sendResponse(res, { success: true, message: 'Portfolio updated.', data: portfolio });
  } catch (e) { next(e); }
};

export const deletePortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolio = await Portfolio.findOneAndDelete({ _id: req.params.id, owner_id: req.user!._id });
    if (!portfolio) { res.status(404).json({ success: false, message: 'Portfolio not found.' }); return; }
    sendResponse(res, { success: true, message: 'Portfolio deleted.' });
  } catch (e) { next(e); }
};
