import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPortfolio extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  owner_id: mongoose.Types.ObjectId;
  currency: string;
  total_aum: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const portfolioSchema = new Schema<IPortfolio>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    currency: { type: String, default: 'GBP', uppercase: true, maxlength: 3 },
    total_aum: { type: Number, default: 0, min: 0 },
    description: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

portfolioSchema.index({ owner_id: 1, name: 1 });

const Portfolio: Model<IPortfolio> = mongoose.model<IPortfolio>('Portfolio', portfolioSchema);
export default Portfolio;
