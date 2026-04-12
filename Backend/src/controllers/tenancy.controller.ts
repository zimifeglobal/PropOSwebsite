import { Request, Response, NextFunction } from 'express';
import Tenancy from '../models/Tenancy';
import Unit from '../models/Unit';
import Asset from '../models/Asset';
import { sendResponse } from '../utils/apiResponse';
import { generateLeasePdf } from '../services/lease.service';

const getUnitIds = async (portfolioIds: unknown[]) => {
  const assets = await Asset.find({ portfolio_id: { $in: portfolioIds } }).select('_id');
  const assetIds = assets.map((a) => a._id);
  const units = await Unit.find({ asset_id: { $in: assetIds } }).select('_id');
  return units.map((u) => u._id);
};

export const createTenancy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenancy = await Tenancy.create(req.body);
    sendResponse(res, { success: true, message: 'Tenancy created.', data: tenancy, statusCode: 201 });
  } catch (e) { next(e); }
};

export const getTenancies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const unitIds = await getUnitIds(req.portfolioIds || []);
    const tenancies = await Tenancy.find({ unit_id: { $in: unitIds } })
      .populate('unit_id', 'unit_number current_rent status')
      .sort({ createdAt: -1 });
    sendResponse(res, { success: true, message: 'Tenancies fetched.', data: tenancies, meta: { total: tenancies.length } });
  } catch (e) { next(e); }
};

export const getTenancy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const unitIds = await getUnitIds(req.portfolioIds || []);
    const tenancy = await Tenancy.findOne({ _id: req.params.id, unit_id: { $in: unitIds } })
      .populate('unit_id').populate('tenant_ids', 'name email');
    if (!tenancy) { res.status(404).json({ success: false, message: 'Tenancy not found.' }); return; }
    sendResponse(res, { success: true, message: 'Tenancy fetched.', data: tenancy });
  } catch (e) { next(e); }
};

export const updateTenancy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const unitIds = await getUnitIds(req.portfolioIds || []);
    const tenancy = await Tenancy.findOneAndUpdate(
      { _id: req.params.id, unit_id: { $in: unitIds } },
      req.body, { new: true, runValidators: true }
    );
    if (!tenancy) { res.status(404).json({ success: false, message: 'Tenancy not found.' }); return; }
    sendResponse(res, { success: true, message: 'Tenancy updated.', data: tenancy });
  } catch (e) { next(e); }
};

export const generateLease = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const tenancy = await Tenancy.findById(id)
      .populate<{ unit_id: { unit_number: string; asset_id: { name: string; address: { street: string; city: string; postcode: string } } } }>({
        path: 'unit_id', populate: { path: 'asset_id', select: 'name address' },
      })
      .populate<{ tenant_ids: Array<{ name: string; email: string }> }>('tenant_ids', 'name email');
    if (!tenancy) { res.status(404).json({ success: false, message: 'Tenancy not found.' }); return; }

    const unit = tenancy.unit_id as { unit_number: string; asset_id: { name: string; address: { street: string; city: string; postcode: string } } };
    const tenant = (tenancy.tenant_ids as Array<{ name: string; email: string }>)[0];

    generateLeasePdf({
      tenancyId: id,
      tenantName: tenant?.name || 'N/A',
      tenantEmail: tenant?.email || 'N/A',
      unitNumber: unit?.unit_number || 'N/A',
      assetName: unit?.asset_id?.name || 'N/A',
      assetAddress: `${unit?.asset_id?.address?.street}, ${unit?.asset_id?.address?.city} ${unit?.asset_id?.address?.postcode}`,
      monthlyRent: tenancy.monthly_rent,
      leaseStart: tenancy.lease_start.toDateString(),
      leaseEnd: tenancy.lease_end.toDateString(),
      depositAmount: tenancy.deposit_amount,
    }, res);
  } catch (e) { next(e); }
};
