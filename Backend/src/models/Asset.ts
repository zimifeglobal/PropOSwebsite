import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAssetAddress {
  street: string;
  city: string;
  postcode: string;
}

export interface IAsset extends Document {
  _id: mongoose.Types.ObjectId;
  portfolio_id: mongoose.Types.ObjectId;
  name: string;
  address: IAssetAddress;
  esg_score: number;
  location: { type: 'Point'; coordinates: [number, number] };
  total_value: number;
  building_health_score: number;
  property_type?: 'residential' | 'commercial' | 'mixed' | 'industrial';
  year_built?: number;
  floor_area_sqm?: number;
  createdAt: Date;
  updatedAt: Date;
}

const assetSchema = new Schema<IAsset>(
  {
    portfolio_id: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      postcode: { type: String, required: true, uppercase: true },
    },
    esg_score: { type: Number, default: 50, min: 0, max: 100 },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    total_value: { type: Number, required: true, min: 0 },
    building_health_score: { type: Number, default: 75, min: 0, max: 100 },
    property_type: { type: String, enum: ['residential', 'commercial', 'mixed', 'industrial'] },
    year_built: { type: Number, min: 1000 },
    floor_area_sqm: { type: Number, min: 0 },
  },
  { timestamps: true }
);

assetSchema.index({ location: '2dsphere' });
assetSchema.index({ portfolio_id: 1 });

const Asset: Model<IAsset> = mongoose.model<IAsset>('Asset', assetSchema);
export default Asset;
