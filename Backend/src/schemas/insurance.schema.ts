import { z } from 'zod';

export const createInsuranceSchema = z.object({
  asset_id: z.string().length(24),
  portfolio_id: z.string().length(24),
  provider: z.string().min(1).max(100),
  policy_number: z.string().optional(),
  policy_type: z.enum(['buildings', 'contents', 'liability', 'combined']),
  premium: z.number().min(0),
  coverage_limit: z.number().min(0),
  expiry_date: z.string().datetime(),
});

export const quoteRequestSchema = z.object({
  asset_id: z.string().length(24),
  policy_type: z.enum(['buildings', 'contents', 'liability', 'combined']),
  coverage_limit: z.number().min(0),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
