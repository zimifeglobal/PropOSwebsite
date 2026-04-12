import { z } from 'zod';

export const createTransactionSchema = z.object({
  portfolio_id: z.string().length(24, 'Invalid portfolio ID'),
  tenancy_id: z.string().length(24).optional(),
  asset_id: z.string().length(24).optional(),
  amount: z.number().positive(),
  direction: z.enum(['in', 'out']),
  category: z.enum(['rent', 'deposit', 'maintenance', 'insurance', 'service_charge', 'refund', 'other']),
  bank_ref: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  date: z.string().datetime().optional(),
});

export const reconcileSchema = z.object({
  portfolio_id: z.string().length(24),
  bank_entries: z.array(
    z.object({
      amount: z.number().positive(),
      bank_ref: z.string().min(1),
      date: z.string().optional(),
    })
  ).min(1).max(100),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type ReconcileInput = z.infer<typeof reconcileSchema>;
