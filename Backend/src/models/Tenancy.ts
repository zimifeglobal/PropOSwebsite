import mongoose, { Document, Schema, Model } from 'mongoose';

export type DepositStatus = 'paid' | 'partial' | 'pending' | 'returned';

export interface ITenancy extends Document {
  _id: mongoose.Types.ObjectId;
  unit_id: mongoose.Types.ObjectId;
  tenant_ids: mongoose.Types.ObjectId[];
  lease_start: Date;
  lease_end: Date;
  lease_doc_url?: string;
  deposit_status: DepositStatus;
  deposit_amount?: number;
  monthly_rent: number;
  bank_ref: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tenancySchema = new Schema<ITenancy>(
  {
    unit_id: { type: Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
    tenant_ids: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lease_start: { type: Date, required: true },
    lease_end: { type: Date, required: true },
    lease_doc_url: { type: String },
    deposit_status: {
      type: String,
      enum: ['paid', 'partial', 'pending', 'returned'],
      default: 'pending',
    },
    deposit_amount: { type: Number, min: 0 },
    monthly_rent: { type: Number, required: true, min: 0 },
    bank_ref: { type: String, required: true, trim: true, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

tenancySchema.index({ tenant_ids: 1 });

const Tenancy: Model<ITenancy> = mongoose.model<ITenancy>('Tenancy', tenancySchema);
export default Tenancy;
