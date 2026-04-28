import Session from '../models/Session.js';

/**
 * Creates a new game session.
 * @param {string} userId - The ID of the user creating the session.
 * @returns {Promise<Object>} The created session.
 */
export const createSession = async (userId) => {
  const session = await Session.create({
    host_id: userId,
    board: Array(9).fill(''),
    status: 'waiting',
  });
  return session;
};

/**
 * Joins an existing game session as a guest.
 * @param {string} sessionId - The short ID of the session.
 * @param {string} userId - The ID of the user joining.
 * @returns {Promise<Object>} The updated session.
 */
export const joinSession = async (sessionId, userId) => {
  const session = await Session.findById(sessionId);

  if (!session) {
    throw { status: 404, message: 'Session not found' };
  }

  if (session.guest_id) {
    throw { status: 409, message: 'Session already full' };
  }

  if (session.host_id.toString() === userId) {
    throw { status: 400, message: 'Host cannot join their own session as a guest' };
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
  const session = await Session.findById(sessionId)
    .populate('host_id', 'name email avatar_url')
    .populate('guest_id', 'name email avatar_url');

  if (!session) {
    throw { status: 404, message: 'Session not found' };
  }

  return session;
};
