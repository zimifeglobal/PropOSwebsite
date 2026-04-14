import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISupportMessage extends Document {
  user: mongoose.Types.ObjectId;
  subject: string;
  body: string;
  emailSnapshot: string;
  nameSnapshot: string;
  createdAt: Date;
}

const supportMessageSchema = new Schema<ISupportMessage>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 8000 },
    emailSnapshot: { type: String, required: true },
    nameSnapshot: { type: String, required: true },
  },
  { timestamps: true }
);

const SupportMessage: Model<ISupportMessage> = mongoose.model<ISupportMessage>('SupportMessage', supportMessageSchema);

export default SupportMessage;
