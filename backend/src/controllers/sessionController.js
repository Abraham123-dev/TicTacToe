import * as sessionService from '../services/sessionService.js';

/**
 * Controller to create a new session.
 */
export const createSession = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const session = await sessionService.createSession(userId);
    res.status(201).json(session);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Controller to join an existing session.
 */
export const joinSession = async (req, res) => {
  const { sessionId, userId } = req.body;

  if (!sessionId || !userId) {
    return res.status(400).json({ error: 'sessionId and userId are required' });
  }

  try {
    const session = await sessionService.joinSession(sessionId, userId);
    res.status(200).json(session);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Controller to get session details.
 */
export const getSession = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await sessionService.getSession(id);
    res.status(200).json(session);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
};
