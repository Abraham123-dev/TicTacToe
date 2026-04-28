import Session from '../models/Session.js';
import User from '../models/User.js';
import { verifyGoogleIdToken } from '../services/googleAuthService.js';
import { checkWinner } from '../utils/gameLogic.js';

/**
 * Game Socket Handler with Production Hardening
 */
export const initGameSocket = (io) => {
  // 1. Socket Authentication Middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error: Token missing'));

    try {
      const googleUser = await verifyGoogleIdToken(token);
      let user = await User.findOne({ google_id: googleUser.google_id });
      
      if (!user) {
        user = await User.create(googleUser);
      }
      
      socket.user = user; // Attach user to socket
      next();
    } catch (error) {
      console.error('Socket Auth Error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected: ${socket.user.name} (${socket.id})`);

    /**
     * Join Room / Reconnection Logic
     */
    socket.on('join_room', async ({ sessionId }) => {
      if (!sessionId) return;
      const roomName = `session_${sessionId}`;
      
      socket.join(roomName);
      console.log(`User ${socket.user.name} joined room: ${roomName}`);

      try {
        const session = await Session.findById(sessionId);
        if (session) {
          // Send latest state immediately to sync client
          socket.emit('game_update', {
            board: session.board,
            current_turn: session.current_turn,
            status: session.status,
            winner: session.winner,
          });
        }
      } catch (error) {
        console.error('Error in join_room:', error);
      }
    });

    /**
     * Authoritative Player Move
     */
    socket.on('player_move', async ({ sessionId, cellIndex }) => {
      const roomName = `session_${sessionId}`;

      try {
        // Fetch latest session from DB to prevent race conditions
        const session = await Session.findById(sessionId);

        // Validation
        if (!session) return socket.emit('invalid_move', { reason: 'Session not found' });
        if (session.status !== 'active') return socket.emit('invalid_move', { reason: 'Game is not active' });
        if (session.board[cellIndex] !== '') return socket.emit('invalid_move', { reason: 'Cell occupied' });

        const isHost = session.host_id.toString() === userId;
        const isGuest = session.guest_id?.toString() === userId;
        if (!isHost && !isGuest) return socket.emit('invalid_move', { reason: 'Not a participant' });

        const playerSymbol = isHost ? 'X' : 'O';
        if (session.current_turn !== playerSymbol) {
          return socket.emit('invalid_move', { reason: 'Not your turn' });
        }

        // Apply atomic-like update
        session.board[cellIndex] = playerSymbol;
        
        const result = checkWinner(session.board);
        if (result) {
          session.status = 'finished';
          session.winner = result;
        } else {
          session.current_turn = playerSymbol === 'X' ? 'O' : 'X';
        }

        await session.save();

        // Log the move
        console.log(`[MOVE] Session: ${sessionId}, User: ${userId}, Cell: ${cellIndex}, Result: ${result || 'continue'}`);

        // Broadcast updates
        if (session.status === 'finished') {
          io.to(roomName).emit('game_over', {
            winner: session.winner,
            board: session.board,
          });
        } else {
          io.to(roomName).emit('game_update', {
            board: session.board,
            current_turn: session.current_turn,
            status: session.status,
          });
        }
      } catch (error) {
        console.error('Error in player_move:', error);
        socket.emit('invalid_move', { reason: 'Server error' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.id})`);
    });
  });
};
