import mongoose, { Document, Schema, Types } from 'mongoose';

interface Wallet extends Document {
  name: string;
  description: string;
  startingBalance: number;
  currentBalance: number;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<Wallet>({
  name: String,
  description: String,
  startingBalance: Number,
  currentBalance: Number,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const WalletModel = mongoose.model<Wallet>('Wallet', walletSchema);

export default WalletModel;