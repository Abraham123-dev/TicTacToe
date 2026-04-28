import { OAuth2Client } from 'google-auth-library';
import { ENV } from '../config/env.js';

const client = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);

/**
 * Verifies the Google ID token and extracts user profile information.
 * @param {string} idToken - The ID token from the frontend.
 * @returns {Promise<Object>} Normalized user information.
 */
export const verifyGoogleIdToken = async (idToken) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: ENV.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    return {
      google_id: payload.sub,
      email: payload.email,
      name: payload.name,
      avatar_url: payload.picture,
    };
  } catch (error) {
    console.error('Google Auth Error:', error.message);
    throw new Error('Invalid Google ID token');
  }
};
