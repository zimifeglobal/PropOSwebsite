import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'cashier';
  isActive: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  deletedAt?: Date | null;
  pii_masked: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  toPublicJSON(): Record<string, unknown>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['admin', 'manager', 'cashier'], default: 'cashier' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    refreshToken: { type: String, select: false },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, select: false },
    deletedAt: { type: Date, default: null },
    pii_masked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Soft-delete: exclude deleted users from all queries
userSchema.pre(/^find/, function (this: mongoose.Query<unknown, IUser>, next) {
  this.where({ deletedAt: null });
  next();
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicJSON = function (): Record<string, unknown> {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    mfaEnabled: this.mfaEnabled,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
  };
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
