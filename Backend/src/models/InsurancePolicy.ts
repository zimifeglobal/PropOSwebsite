import mongoose, { Document, Schema, Model } from 'mongoose';

export type PolicyType = 'buildings' | 'contents' | 'liability' | 'combined';

export interface IInsurancePolicy extends Document {
  _id: mongoose.Types.ObjectId;
  asset_id: mongoose.Types.ObjectId;
  portfolio_id: mongoose.Types.ObjectId;
  provider: string;
  policy_number?: string;
  policy_type: PolicyType;
  premium: number;
  coverage_limit: number;
  expiry_date: Date;
  is_active: boolean;
  esg_discount_applied: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const insurancePolicySchema = new Schema<IInsurancePolicy>(
  {
    asset_id: { type: Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    portfolio_id: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true, index: true },
    provider: { type: String, required: true, trim: true },
    policy_number: { type: String },
    policy_type: {
      type: String,
      enum: ['buildings', 'contents', 'liability', 'combined'],
      required: true,
    },
    premium: { type: Number, required: true, min: 0 },
    coverage_limit: { type: Number, required: true, min: 0 },
    expiry_date: { type: Date, required: true },
    is_active: { type: Boolean, default: true },
    esg_discount_applied: { type: Boolean, default: false },
  },
  { timestamps: true }
);

insurancePolicySchema.index({ expiry_date: 1 });
insurancePolicySchema.index({ portfolio_id: 1, is_active: 1 });

const InsurancePolicy: Model<IInsurancePolicy> = mongoose.model<IInsurancePolicy>(
  'InsurancePolicy',
  insurancePolicySchema
);
export default InsurancePolicy;
