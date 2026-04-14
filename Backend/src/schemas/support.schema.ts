import { z } from 'zod';

export const supportMessageSchema = z.object({
  subject: z.string().min(2, 'Subject is too short').max(200),
  body: z.string().min(10, 'Please write at least 10 characters').max(8000),
});
