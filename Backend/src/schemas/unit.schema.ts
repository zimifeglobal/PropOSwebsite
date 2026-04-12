import { z } from 'zod';

export const createUnitSchema = z.object({
  asset_id: z.string().length(24),
  unit_number: z.string().min(1).max(20),
  floor: z.number().optional(),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  current_rent: z.number().min(0),
  status: z.enum(['occupied', 'vacant', 'maintenance']).default('vacant'),
  floor_area_sqm: z.number().min(0).optional(),
});

export const updateUnitSchema = createUnitSchema.partial().omit({ asset_id: true });
