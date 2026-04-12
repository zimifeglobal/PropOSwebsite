import { Request, Response, NextFunction } from 'express';
import Asset from '../models/Asset';
import { sendResponse } from '../utils/apiResponse';

export const createAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const asset = await Asset.create(req.body);
    sendResponse(res, { success: true, message: 'Asset created.', data: asset, statusCode: 201 });
  } catch (e) { next(e); }
};

export const getAssets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolioIds = req.portfolioIds || [];
    const { city, property_type, min_esg } = req.query;
    const filter: Record<string, unknown> = { portfolio_id: { $in: portfolioIds } };
    if (city) filter['address.city'] = new RegExp(city as string, 'i');
    if (property_type) filter.property_type = property_type;
    if (min_esg) filter.esg_score = { $gte: Number(min_esg) };
    const assets = await Asset.find(filter).sort({ createdAt: -1 });
    sendResponse(res, { success: true, message: 'Assets fetched.', data: assets, meta: { total: assets.length } });
  } catch (e) { next(e); }
};

export const getAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolioIds = req.portfolioIds || [];
    const asset = await Asset.findOne({ _id: req.params.id, portfolio_id: { $in: portfolioIds } });
    if (!asset) { res.status(404).json({ success: false, message: 'Asset not found.' }); return; }
    sendResponse(res, { success: true, message: 'Asset fetched.', data: asset });
  } catch (e) { next(e); }
};

export const updateAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolioIds = req.portfolioIds || [];
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, portfolio_id: { $in: portfolioIds } },
      req.body, { new: true, runValidators: true }
    );
    if (!asset) { res.status(404).json({ success: false, message: 'Asset not found.' }); return; }
    sendResponse(res, { success: true, message: 'Asset updated.', data: asset });
  } catch (e) { next(e); }
};

export const deleteAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolioIds = req.portfolioIds || [];
    const asset = await Asset.findOneAndDelete({ _id: req.params.id, portfolio_id: { $in: portfolioIds } });
    if (!asset) { res.status(404).json({ success: false, message: 'Asset not found.' }); return; }
    sendResponse(res, { success: true, message: 'Asset deleted.' });
  } catch (e) { next(e); }
};
