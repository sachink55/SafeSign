import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    signature: {
      type: String, // Cloudinary URL
      required: [
        function() { return this.role === 'user'; },
        'Signature is required for regular users'
      ],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    bankDetails: {
      accountNumber: { type: String, default: '' },
      balance: { type: Number, default: 0 },
      accountType: { type: String, default: 'Savings' },
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
