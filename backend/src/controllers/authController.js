import User from '../models/User.js';
import { verifyGoogleIdToken } from '../services/googleAuthService.js';

/**
 * Handles Google Authentication.
 * Verifies token, creates or updates user, and returns user data.
 */
export const googleAuth = async (req, res) => {
  const { id_token } = req.body;

  if (!id_token) {
    return res.status(400).json({ error: 'id_token is required' });
  }

  try {
    const googleUser = await verifyGoogleIdToken(id_token);

    // Find user by google_id or email
    let user = await User.findOne({
      $or: [{ google_id: googleUser.google_id }, { email: googleUser.email }],
    });

    if (!user) {
      // Create new user if not found
      user = await User.create(googleUser);
    } else {
      // Update existing user info in case it changed on Google
      user.name = googleUser.name;
      user.avatar_url = googleUser.avatar_url;
      // Ensure google_id is set if it was previously an email-only account (if applicable)
      user.google_id = googleUser.google_id;
      await user.save();
    }

    res.status(200).json(user);
  } catch (error) {
    if (error.message === 'Invalid Google ID token') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};
