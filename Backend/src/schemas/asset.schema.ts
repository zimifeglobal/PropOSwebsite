import { z } from 'zod';

export const createAssetSchema = z.object({
  portfolio_id: z.string().length(24, 'Invalid portfolio ID'),
  name: z.string().min(1).max(200),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    postcode: z.string().min(1).max(10),
  }),
  esg_score: z.number().min(0).max(100).default(50),
  location: z
    .object({
      type: z.literal('Point').default('Point'),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .optional(),
  total_value: z.number().min(0),
  property_type: z.enum(['residential', 'commercial', 'mixed', 'industrial']).optional(),
  year_built: z.number().min(1000).optional(),
  floor_area_sqm: z.number().min(0).optional(),
});

export const updateAssetSchema = createAssetSchema.partial().omit({ portfolio_id: true });
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
