import * as sessionService from '../services/sessionService.js';

/**
 * Controller to create a new session.
 */
export const createSession = async (req, res) => {
  const userId = req.user._id;

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
  const { sessionId } = req.body || {};
  const userId = req.user._id;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const session = await sessionService.joinSession(sessionId, userId);

    // Emit Socket Events
    const io = req.app.get('io');
    const roomName = `session_${sessionId}`;
    
    io.to(roomName).emit('player_joined', {
      message: 'Guest joined',
      sessionId,
      guestId: userId,
    });

    io.to(roomName).emit('game_update', {
      board: session.board,
      current_turn: session.current_turn,
      status: session.status,
    });

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
