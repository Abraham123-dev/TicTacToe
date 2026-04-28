import mongoose from 'mongoose';

/**
 * User Model
 * Stores Google OAuth user information.
 */
const userSchema = new mongoose.Schema({
  google_id: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  avatar_url: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const User = mongoose.model('User', userSchema);
export default User;
