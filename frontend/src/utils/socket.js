import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Centralized Socket.io instance
 */
export const socket = io(SOCKET_URL, {
  autoConnect: false, // Don't connect until we have a token
  auth: (cb) => {
    cb({
      token: localStorage.getItem('google_id_token'),
    });
  },
});

/**
 * Helper to connect the socket
 */
export const connectSocket = () => {
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
