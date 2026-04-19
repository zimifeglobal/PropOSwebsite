import { z } from 'zod';

export const createMaintenanceTicketSchema = z.object({
  unit_id: z.string().length(24),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(8000),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});

export const assignTechnicianSchema = z.object({
  assigned_technician_name: z.string().min(2).max(120),
});
