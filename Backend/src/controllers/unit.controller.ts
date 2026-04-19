import { Request, Response, NextFunction } from 'express';
import Unit from '../models/Unit';
import Asset from '../models/Asset';
import Portfolio from '../models/Portfolio';
import { sendResponse } from '../utils/apiResponse';

const DEMO_PORTFOLIO_NAME = 'PropOS Demo Directory';
const DEMO_ASSET_NAME = 'Meridian Wharf (Demo)';

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

/** Idempotent: ensures at least 24 demo units exist for the directory (MongoDB-backed). */
export const seedDemoUnits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const portfolios = await Portfolio.find({ owner_id: userId }).select('_id');
    const pids = portfolios.map((p) => p._id);
    const assetIds = await Asset.find({ portfolio_id: { $in: pids } }).select('_id');
    const existingCount = await Unit.countDocuments({ asset_id: { $in: assetIds } });
    if (existingCount >= 20) {
      sendResponse(res, {
        success: true,
        message: 'Directory already has 20+ units.',
        data: { seeded: false, unitCount: existingCount },
      });
      return;
    }

    let portfolio = await Portfolio.findOne({ owner_id: userId, name: DEMO_PORTFOLIO_NAME });
    if (!portfolio) {
      portfolio = await Portfolio.create({
        owner_id: userId,
        name: DEMO_PORTFOLIO_NAME,
        currency: 'GBP',
        total_aum: 4_200_000,
        description: 'Auto-created demo portfolio for the property directory.',
      });
    }

    let asset = await Asset.findOne({ portfolio_id: portfolio._id, name: DEMO_ASSET_NAME });
    if (!asset) {
      asset = await Asset.create({
        portfolio_id: portfolio._id,
        name: DEMO_ASSET_NAME,
        address: { street: '100 Canary Riverside', city: 'London', postcode: 'E14 9GG' },
        total_value: 18_500_000,
        esg_score: 74,
        building_health_score: 81,
        property_type: 'residential',
      });
    }

    const existingUnits = await Unit.find({ asset_id: asset._id }).select('unit_number');
    const have = new Set(existingUnits.map((u) => u.unit_number));
    const docs = [];
    for (let i = 1; i <= 24; i += 1) {
      const unum = `U${String(i).padStart(2, '0')}`;
      if (have.has(unum)) continue;
      docs.push({
        asset_id: asset._id,
        unit_number: unum,
        floor: Math.floor((i - 1) / 6) + 1,
        bedrooms: i % 3 === 0 ? 2 : 1,
        bathrooms: 1,
        current_rent: 820 + ((i * 17) % 450),
        status: i % 2 === 0 ? 'occupied' : 'vacant',
        floor_area_sqm: 42 + (i % 6) * 3,
      });
    }
    if (docs.length) await Unit.insertMany(docs);
    const total = await Unit.countDocuments({ asset_id: asset._id });
    sendResponse(res, {
      success: true,
      message: 'Demo units ready.',
      data: {
        seeded: docs.length > 0,
        created: docs.length,
        demoAssetId: asset._id.toString(),
        unitCount: total,
      },
      statusCode: docs.length ? 201 : 200,
    });
  } catch (e) {
    next(e);
  }
};
