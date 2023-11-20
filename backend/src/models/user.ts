import mongoose, { Document, Schema } from 'mongoose';

interface User extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'User' | 'Admin';
  birthday: string;
}

const userSchema = new Schema<User>({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['User', 'Admin'],
    required: true,
  },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
});

const UserModel = mongoose.model<User>('User', userSchema);

export default UserModel;