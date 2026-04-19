import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import MaintenanceTicket from '../models/MaintenanceTicket';
import Unit from '../models/Unit';
import Asset from '../models/Asset';
import { sendResponse } from '../utils/apiResponse';
import { maintenanceBus, notifyTicketsChanged } from '../services/maintenance-events';

const ticketPopulate = {
  path: 'unit_id' as const,
  select: 'unit_number status current_rent',
  populate: { path: 'asset_id', select: 'name address' },
};

const getAssetIdsForUser = async (portfolioIds: mongoose.Types.ObjectId[]) => {
  const assets = await Asset.find({ portfolio_id: { $in: portfolioIds } }).select('_id');
  return assets.map((a) => a._id);
};

const unitInScope = async (
  unitId: string,
  portfolioIds: mongoose.Types.ObjectId[] | undefined
): Promise<boolean> => {
  if (!portfolioIds?.length) return false;
  const assetIds = await getAssetIdsForUser(portfolioIds);
  const u = await Unit.findOne({ _id: unitId, asset_id: { $in: assetIds } });
  return !!u;
};

export const createTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { unit_id, title, description, priority } = req.body;
    const ok = await unitInScope(unit_id, req.portfolioIds);
    if (!ok) {
      res.status(403).json({ success: false, message: 'Unit not in your portfolio scope.' });
      return;
    }
    const doc = await MaintenanceTicket.create({
      unit_id,
      title: title.trim(),
      description: description.trim(),
      priority: priority || 'normal',
      created_by: req.user!._id,
    });
    const populated = await MaintenanceTicket.findById(doc._id).populate(ticketPopulate);
    sendResponse(res, {
      success: true,
      message: 'Maintenance ticket created.',
      data: populated,
      statusCode: 201,
    });
    setImmediate(() => notifyTicketsChanged());
  } catch (e) {
    next(e);
  }
};

export const listTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assetIds = await getAssetIdsForUser(req.portfolioIds || []);
    const units = await Unit.find({ asset_id: { $in: assetIds } }).select('_id');
    const unitIds = units.map((u) => u._id);
    const filter: Record<string, unknown> = { unit_id: { $in: unitIds } };
    if (req.query.status) filter.status = req.query.status;
    const tickets = await MaintenanceTicket.find(filter).populate(ticketPopulate).sort({ updatedAt: -1 });
    sendResponse(res, {
      success: true,
      message: 'Tickets fetched.',
      data: tickets,
      meta: { total: tickets.length },
    });
  } catch (e) {
    next(e);
  }
};

export const assignTechnician = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { assigned_technician_name } = req.body;
    const ticket = await MaintenanceTicket.findById(req.params.id);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found.' });
      return;
    }
    const ok = await unitInScope(ticket.unit_id.toString(), req.portfolioIds);
    if (!ok) {
      res.status(403).json({ success: false, message: 'Ticket not in your portfolio scope.' });
      return;
    }
    ticket.assigned_technician_name = assigned_technician_name.trim();
    ticket.assigned_at = new Date();
    ticket.status = 'assigned';
    await ticket.save();
    const populated = await MaintenanceTicket.findById(ticket._id).populate(ticketPopulate);
    sendResponse(res, { success: true, message: 'Technician assigned.', data: populated });
    setImmediate(() => notifyTicketsChanged());
  } catch (e) {
    next(e);
  }
};

/**
 * Server-Sent Events stream for real-time ticket list invalidation.
 * Clients should refetch GET /maintenance/tickets (scoped); EventSource cannot send Authorization, so use fetch + stream on the client.
 */
export const streamMaintenanceEvents = (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (res.socket) {
    res.socket.setTimeout(0);
  }

  let ping: ReturnType<typeof setInterval> | undefined;

  function cleanup(): void {
    if (ping !== undefined) clearInterval(ping);
    maintenanceBus.off('tickets_changed', onTicketsChanged);
  }

  const send = (event: string, payload: unknown) => {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      cleanup();
    }
  };

  function onTicketsChanged(): void {
    send('tickets_changed', { type: 'tickets_changed', at: new Date().toISOString() });
  }

  maintenanceBus.on('tickets_changed', onTicketsChanged);

  ping = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      cleanup();
    }
  }, 25000);

  send('connected', { type: 'connected', at: new Date().toISOString() });

  req.on('close', cleanup);
  req.on('aborted', cleanup);
};
