import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Centralized Socket.io instance
 */
export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

/**
 * Helper to connect the socket with current token
 */
export const connectSocket = () => {
  const token = localStorage.getItem('google_id_token');
  socket.auth = { token };
  
  if (!socket.connected) {
    socket.connect();
  }
};

/**
 * Helper to disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
