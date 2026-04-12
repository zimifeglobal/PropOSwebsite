import mongoose, { Document, Schema, Model } from 'mongoose';

export type ComplianceType = 'AML' | 'GDPR' | 'KYC' | 'EICR' | 'CP12' | 'EPC';
export type ComplianceStatus = 'pass' | 'fail' | 'flagged' | 'pending' | 'review';

export interface IComplianceLog extends Document {
  _id: mongoose.Types.ObjectId;
  entity_id: mongoose.Types.ObjectId;
  entity_type: 'transaction' | 'user' | 'asset' | 'tenancy';
  portfolio_id?: mongoose.Types.ObjectId;
  type: ComplianceType;
  status: ComplianceStatus;
  metadata: Record<string, unknown>;
  last_audit: Date;
  expiry_date?: Date;
  reviewed_by?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const complianceLogSchema = new Schema<IComplianceLog>(
  {
    entity_id: { type: Schema.Types.ObjectId, required: true, index: true },
    entity_type: {
      type: String,
      enum: ['transaction', 'user', 'asset', 'tenancy'],
      required: true,
    },
    portfolio_id: { type: Schema.Types.ObjectId, ref: 'Portfolio', index: true },
    type: { type: String, enum: ['AML', 'GDPR', 'KYC', 'EICR', 'CP12', 'EPC'], required: true },
    status: {
      type: String,
      enum: ['pass', 'fail', 'flagged', 'pending', 'review'],
      default: 'pending',
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    last_audit: { type: Date, default: Date.now },
    expiry_date: { type: Date },
    reviewed_by: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

complianceLogSchema.index({ type: 1, status: 1 });
complianceLogSchema.index({ expiry_date: 1 });
complianceLogSchema.index({ portfolio_id: 1, type: 1 });

const ComplianceLog: Model<IComplianceLog> = mongoose.model<IComplianceLog>(
  'ComplianceLog',
  complianceLogSchema
);
export default ComplianceLog;
