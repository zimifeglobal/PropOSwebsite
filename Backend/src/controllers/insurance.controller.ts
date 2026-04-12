import { Request, Response, NextFunction } from 'express';
import InsurancePolicy from '../models/InsurancePolicy';
import { calculateInsuranceQuote } from '../services/insurance.service';
import { sendResponse } from '../utils/apiResponse';

export const getQuote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { asset_id, policy_type, coverage_limit } = req.body;
    const quote = await calculateInsuranceQuote(asset_id, policy_type, Number(coverage_limit));
    sendResponse(res, { success: true, message: 'Insurance quote generated.', data: quote });
  } catch (e) { next(e); }
};

export const createPolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const policy = await InsurancePolicy.create(req.body);
    sendResponse(res, { success: true, message: 'Policy created.', data: policy, statusCode: 201 });
  } catch (e) { next(e); }
};

export const getPolicies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolioIds = req.portfolioIds || [];
    const policies = await InsurancePolicy.find({ portfolio_id: { $in: portfolioIds } })
      .populate('asset_id', 'name address')
      .sort({ expiry_date: 1 });
    sendResponse(res, { success: true, message: 'Policies fetched.', data: policies, meta: { total: policies.length } });
  } catch (e) { next(e); }
};

export const getPolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolioIds = req.portfolioIds || [];
    const policy = await InsurancePolicy.findOne({ _id: req.params.id, portfolio_id: { $in: portfolioIds } }).populate('asset_id');
    if (!policy) { res.status(404).json({ success: false, message: 'Policy not found.' }); return; }
    sendResponse(res, { success: true, message: 'Policy fetched.', data: policy });
  } catch (e) { next(e); }
};

export const updatePolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolioIds = req.portfolioIds || [];
    const policy = await InsurancePolicy.findOneAndUpdate(
      { _id: req.params.id, portfolio_id: { $in: portfolioIds } },
      req.body, { new: true, runValidators: true }
    );
    if (!policy) { res.status(404).json({ success: false, message: 'Policy not found.' }); return; }
    sendResponse(res, { success: true, message: 'Policy updated.', data: policy });
  } catch (e) { next(e); }
};
