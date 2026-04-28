/**
 * Game Socket Handler
 * Manages real-time communication and room management.
 */
export const initGameSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    /**
     * Join Room Event
     * Allows a player to join a specific session room.
     */
    socket.on('join_room', ({ sessionId }) => {
      if (!sessionId) return;

      const roomName = `session_${sessionId}`;
      socket.join(roomName);
      
      console.log(`Socket ${socket.id} joined room: ${roomName}`);

      // Notify others in the room
      socket.to(roomName).emit('player_joined', {
        socketId: socket.id,
        message: 'A player has joined the session',
      });
    });

    /**
     * Handle Disconnection
     */
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
