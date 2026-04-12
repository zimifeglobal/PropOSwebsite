import mongoose, { Document, Schema, Model } from 'mongoose';

export type TransactionDirection = 'in' | 'out';
export type TransactionCategory =
  | 'rent'
  | 'deposit'
  | 'maintenance'
  | 'insurance'
  | 'service_charge'
  | 'refund'
  | 'other';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  portfolio_id: mongoose.Types.ObjectId;
  tenancy_id?: mongoose.Types.ObjectId;
  asset_id?: mongoose.Types.ObjectId;
  amount: number;
  direction: TransactionDirection;
  reconciled: boolean;
  reconciled_at?: Date;
  category: TransactionCategory;
  bank_ref: string;
  description?: string;
  aml_flagged: boolean;
  aml_reviewed: boolean;
  aml_reviewed_by?: mongoose.Types.ObjectId;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    portfolio_id: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true, index: true },
    tenancy_id: { type: Schema.Types.ObjectId, ref: 'Tenancy' },
    asset_id: { type: Schema.Types.ObjectId, ref: 'Asset' },
    amount: { type: Number, required: true, min: 0 },
    direction: { type: String, enum: ['in', 'out'], required: true },
    reconciled: { type: Boolean, default: false },
    reconciled_at: { type: Date },
    category: {
      type: String,
      enum: ['rent', 'deposit', 'maintenance', 'insurance', 'service_charge', 'refund', 'other'],
      required: true,
    },
    bank_ref: { type: String, required: true, trim: true, index: true },
    description: { type: String },
    aml_flagged: { type: Boolean, default: false, index: true },
    aml_reviewed: { type: Boolean, default: false },
    aml_reviewed_by: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

transactionSchema.index({ portfolio_id: 1, date: -1 });
transactionSchema.index({ aml_flagged: 1, aml_reviewed: 1 });
transactionSchema.index({ reconciled: 1 });

const Transaction: Model<ITransaction> = mongoose.model<ITransaction>(
  'Transaction',
  transactionSchema
);
export default Transaction;
