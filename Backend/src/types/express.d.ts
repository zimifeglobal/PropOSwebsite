import mongoose from 'mongoose';
import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser & { _id: mongoose.Types.ObjectId };
      portfolioIds?: mongoose.Types.ObjectId[];
    }
  }
}

export {};
