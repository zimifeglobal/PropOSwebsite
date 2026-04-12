import { Request, Response, NextFunction } from 'express';
import ComplianceLog from '../models/ComplianceLog';
import { getComplianceAuditStatus } from '../services/compliance.service';
import { sendResponse } from '../utils/apiResponse';

export const getAuditStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolioIds = (req.portfolioIds || []).map(String);
    const status = await getComplianceAuditStatus(portfolioIds);
    sendResponse(res, { success: true, message: 'Compliance audit status.', data: status });
  } catch (e) { next(e); }
};

export const getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolioIds = req.portfolioIds || [];
    const filter: Record<string, unknown> = { portfolio_id: { $in: portfolioIds } };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const logs = await ComplianceLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    const total = await ComplianceLog.countDocuments(filter);
    sendResponse(res, { success: true, message: 'Compliance logs.', data: logs, meta: { total, page, limit } });
  } catch (e) { next(e); }
};

export const createLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const log = await ComplianceLog.create(req.body);
    sendResponse(res, { success: true, message: 'Compliance log created.', data: log, statusCode: 201 });
  } catch (e) { next(e); }
};

export const updateLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolioIds = req.portfolioIds || [];
    const log = await ComplianceLog.findOneAndUpdate(
      { _id: req.params.id, portfolio_id: { $in: portfolioIds } },
      { ...req.body, reviewed_by: req.user!._id, last_audit: new Date() },
      { new: true }
    );
    if (!log) { res.status(404).json({ success: false, message: 'Log not found.' }); return; }
    sendResponse(res, { success: true, message: 'Compliance log updated.', data: log });
  } catch (e) { next(e); }
};
