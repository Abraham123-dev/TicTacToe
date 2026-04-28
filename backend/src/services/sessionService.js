import Session from '../models/Session.js';

/**
 * Creates a new game session.
 * @param {string} userId - The ID of the user creating the session.
 * @returns {Promise<Object>} The created session.
 */
export const createSession = async (userId) => {
  console.log(`[SERVICE] Creating session in DB for user: ${userId}`);
  try {
    const session = await Session.create({
      host_id: userId,
      board: Array(9).fill(''),
      status: 'waiting',
    });
    console.log(`[SERVICE] Session successfully created in DB: ${session._id}`);
    return session;
  } catch (error) {
    console.error(`[SERVICE] Error creating session in DB: ${error.message}`);
    throw error;
  }
};

/**
 * Joins an existing game session as a guest.
 * @param {string} sessionId - The short ID of the session.
 * @param {string} userId - The ID of the user joining.
 * @returns {Promise<Object>} The updated session.
 */
export const joinSession = async (sessionId, userId) => {
  const session = await Session.findById(sessionId.toUpperCase());

  if (!session) {
    throw { status: 404, message: 'Session not found' };
  }

  // If the user is already the host or the guest, just return the session (allow re-joining)
  const isHost = session.host_id.toString() === userId;
  const isGuest = session.guest_id?.toString() === userId;

  if (isHost || isGuest) {
    return session;
  }

  if (session.guest_id) {
    throw { status: 409, message: 'Session already full' };
  }

  session.guest_id = userId;
  session.status = 'active';
  await session.save();

  return session;
};

/**
 * Retrieves a session by ID with populated user info.
 * @param {string} sessionId - The short ID of the session.
 * @returns {Promise<Object>} The populated session.
 */
export const getSession = async (sessionId) => {
  const session = await Session.findById(sessionId.toUpperCase())
    .populate('host_id', 'name email avatar_url')
    .populate('guest_id', 'name email avatar_url');

  if (!session) {
    throw { status: 404, message: 'Session not found' };
  }

  return session;
};
