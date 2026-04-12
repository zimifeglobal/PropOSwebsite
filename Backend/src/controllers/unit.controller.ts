import { Request, Response, NextFunction } from 'express';
import Unit from '../models/Unit';
import Asset from '../models/Asset';
import { sendResponse } from '../utils/apiResponse';

const getAssetIds = async (portfolioIds: unknown[]) => {
  const assets = await Asset.find({ portfolio_id: { $in: portfolioIds } }).select('_id');
  return assets.map((a) => a._id);
};

export const createUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assetIds = await getAssetIds(req.portfolioIds || []);
    if (!assetIds.some((id) => id.toString() === req.body.asset_id)) {
      res.status(403).json({ success: false, message: 'Asset not in your portfolio.' }); return;
    }
    const unit = await Unit.create(req.body);
    sendResponse(res, { success: true, message: 'Unit created.', data: unit, statusCode: 201 });
  } catch (e) { next(e); }
};

export const getUnits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assetIds = await getAssetIds(req.portfolioIds || []);
    const filter: Record<string, unknown> = { asset_id: { $in: assetIds } };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.asset_id) filter.asset_id = req.query.asset_id;
    const units = await Unit.find(filter).populate('asset_id', 'name address').sort({ createdAt: -1 });
    sendResponse(res, { success: true, message: 'Units fetched.', data: units, meta: { total: units.length } });
  } catch (e) { next(e); }
};

export const getUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assetIds = await getAssetIds(req.portfolioIds || []);
    const unit = await Unit.findOne({ _id: req.params.id, asset_id: { $in: assetIds } }).populate('asset_id', 'name address');
    if (!unit) { res.status(404).json({ success: false, message: 'Unit not found.' }); return; }
    sendResponse(res, { success: true, message: 'Unit fetched.', data: unit });
  } catch (e) { next(e); }
};

export const updateUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assetIds = await getAssetIds(req.portfolioIds || []);
    const unit = await Unit.findOneAndUpdate(
      { _id: req.params.id, asset_id: { $in: assetIds } },
      req.body, { new: true, runValidators: true }
    );
    if (!unit) { res.status(404).json({ success: false, message: 'Unit not found.' }); return; }
    sendResponse(res, { success: true, message: 'Unit updated.', data: unit });
  } catch (e) { next(e); }
};

export const deleteUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assetIds = await getAssetIds(req.portfolioIds || []);
    const unit = await Unit.findOneAndDelete({ _id: req.params.id, asset_id: { $in: assetIds } });
    if (!unit) { res.status(404).json({ success: false, message: 'Unit not found.' }); return; }
    sendResponse(res, { success: true, message: 'Unit deleted.' });
  } catch (e) { next(e); }
};
