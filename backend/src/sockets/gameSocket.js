import Session from '../models/Session.js';
import { checkWinner } from '../utils/gameLogic.js';

/**
 * Game Socket Handler
 */
export const initGameSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    /**
     * Join Room
     */
    socket.on('join_room', ({ sessionId }) => {
      if (!sessionId) return;
      const roomName = `session_${sessionId}`;
      socket.join(roomName);
      socket.to(roomName).emit('player_joined', { socketId: socket.id });
    });

    /**
     * Handle Player Move
     */
    socket.on('player_move', async ({ sessionId, cellIndex, playerId }) => {
      try {
        const session = await Session.findById(sessionId);

        // 1. Validation
        if (!session) {
          return socket.emit('invalid_move', { reason: 'Session not found' });
        }
        if (session.status !== 'active') {
          return socket.emit('invalid_move', { reason: 'Game is not active' });
        }
        if (session.board[cellIndex] !== '') {
          return socket.emit('invalid_move', { reason: 'Cell already occupied' });
        }

        // 2. Identify Player Symbol
        const isHost = session.host_id.toString() === playerId;
        const isGuest = session.guest_id?.toString() === playerId;
        
        if (!isHost && !isGuest) {
          return socket.emit('invalid_move', { reason: 'Player not in session' });
        }

        const playerSymbol = isHost ? 'X' : 'O';

        // 3. Turn Validation
        if (session.current_turn !== playerSymbol) {
          return socket.emit('invalid_move', { reason: 'Not your turn' });
        }

        // 4. Apply Move
        session.board[cellIndex] = playerSymbol;
        
        // 5. Check for Win/Draw
        const result = checkWinner(session.board);
        
        if (result) {
          session.status = 'finished';
          session.winner = result;
        } else {
          session.current_turn = playerSymbol === 'X' ? 'O' : 'X';
        }

        // 6. Persist to Database
        await session.save();

        // 7. Broadcast Updates
        const roomName = `session_${sessionId}`;
        if (session.status === 'finished') {
          io.to(roomName).emit('game_over', {
            winner: session.winner,
            board: session.board,
          });
        } else {
          io.to(roomName).emit('game_update', {
            board: session.board,
            current_turn: session.current_turn,
          });
        }

      } catch (error) {
        console.error('Move Error:', error);
        socket.emit('invalid_move', { reason: 'Server error processing move' });
      }
    });

    /**
     * Disconnect
     */
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
