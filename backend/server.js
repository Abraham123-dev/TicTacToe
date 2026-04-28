import http from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import { ENV } from './src/config/env.js';
import connectDB from './src/config/db.js';
import { initGameSocket } from './src/sockets/gameSocket.js';

/**
 * Initialize Database Connection
 */
connectDB();

/**
 * Create HTTP server and attach Express app
 */
const server = http.createServer(app);

/**
 * Initialize Socket.io and attach to HTTP server
 */
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

/**
 * Initialize Game Sockets
 */
initGameSocket(io);

/**
 * Start the server
 */
const PORT = ENV.PORT;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
