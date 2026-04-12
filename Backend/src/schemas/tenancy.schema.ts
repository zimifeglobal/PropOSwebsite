import { z } from 'zod';

export const createTenancySchema = z.object({
  unit_id: z.string().length(24),
  tenant_ids: z.array(z.string().length(24)).min(1),
  lease_start: z.string().datetime(),
  lease_end: z.string().datetime(),
  deposit_status: z.enum(['paid', 'partial', 'pending', 'returned']).default('pending'),
  deposit_amount: z.number().min(0).optional(),
  monthly_rent: z.number().min(0),
  bank_ref: z.string().min(1).max(50),
  notes: z.string().max(1000).optional(),
});

export const updateTenancySchema = createTenancySchema.partial().omit({ unit_id: true });
