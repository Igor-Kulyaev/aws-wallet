import mongoose, { Document, Schema, Types } from 'mongoose';

interface Income extends Document {
  name: string;
  type: string;
  amount: number;
  userId: Types.ObjectId;
  walletId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const incomeSchema = new Schema<Income>({
  name: String,
  type: String,
  amount: Number,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  walletId: {
    type: Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const IncomeModel = mongoose.model<Income>('Income', incomeSchema);

export default IncomeModel;