import mongoose, { Document, Schema, Model } from 'mongoose';

export type MaintenanceTicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
export type MaintenancePriority = 'low' | 'normal' | 'high';

export interface IMaintenanceTicket extends Document {
  _id: mongoose.Types.ObjectId;
  unit_id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceTicketStatus;
  assigned_technician_name?: string;
  assigned_at?: Date;
  created_by: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const maintenanceTicketSchema = new Schema<IMaintenanceTicket>(
  {
    unit_id: { type: Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 8000 },
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    assigned_technician_name: { type: String, trim: true, maxlength: 120 },
    assigned_at: { type: Date },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

maintenanceTicketSchema.index({ createdAt: -1 });

const MaintenanceTicket: Model<IMaintenanceTicket> = mongoose.model<IMaintenanceTicket>(
  'MaintenanceTicket',
  maintenanceTicketSchema
);
export default MaintenanceTicket;
