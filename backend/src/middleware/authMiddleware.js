import { verifyGoogleIdToken } from '../services/googleAuthService.js';
import User from '../models/User.js';

/**
 * Middleware to verify Google ID Token and attach user to request.
 */
export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  const idToken = authHeader.split(' ')[1];

  try {
    const googleUser = await verifyGoogleIdToken(idToken);
    
    // Find or create user
    let user = await User.findOne({ google_id: googleUser.google_id });
    
    if (!user) {
      user = await User.create(googleUser);
    } else {
      // Update info if needed
      user.name = googleUser.name;
      user.avatar_url = googleUser.avatar_url;
      await user.save();
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
