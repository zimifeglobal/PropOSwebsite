import { z } from 'zod';

export const createPortfolioSchema = z.object({
  name: z.string().min(1).max(200),
  currency: z.string().length(3).default('GBP'),
  total_aum: z.number().min(0).default(0),
  description: z.string().max(1000).optional(),
});

export const updatePortfolioSchema = createPortfolioSchema.partial();
export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
