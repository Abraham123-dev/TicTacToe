import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';

const app = express();

/**
 * Global Middlewares
 */
app.use(express.json());
app.use(cors());

/**
 * Routes
 */
app.use('/api/auth', authRoutes);

/**
 * Test Route
 * GET /api/health -> returns { status: "ok" }
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
