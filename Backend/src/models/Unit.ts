import mongoose, { Document, Schema, Model } from 'mongoose';

export type UnitStatus = 'occupied' | 'vacant' | 'maintenance';

export interface IUnit extends Document {
  _id: mongoose.Types.ObjectId;
  asset_id: mongoose.Types.ObjectId;
  unit_number: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  current_rent: number;
  status: UnitStatus;
  floor_area_sqm?: number;
  createdAt: Date;
  updatedAt: Date;
}

const unitSchema = new Schema<IUnit>(
  {
    asset_id: { type: Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    unit_number: { type: String, required: true, trim: true },
    floor: { type: Number },
    bedrooms: { type: Number, min: 0 },
    bathrooms: { type: Number, min: 0 },
    current_rent: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['occupied', 'vacant', 'maintenance'], default: 'vacant' },
    floor_area_sqm: { type: Number, min: 0 },
  },
  { timestamps: true }
);

unitSchema.index({ asset_id: 1, unit_number: 1 }, { unique: true });

const Unit: Model<IUnit> = mongoose.model<IUnit>('Unit', unitSchema);
export default Unit;
