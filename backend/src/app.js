import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

const app = express();

/**
 * Global Middlewares
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

/**
 * Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);

/**
 * Test Route
 * GET /api/health -> returns { status: "ok" }
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
