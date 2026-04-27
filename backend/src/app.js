import express from 'express';
import cors from 'cors';

const app = express();

/**
 * Global Middlewares
 */
app.use(express.json());
app.use(cors());

/**
 * Test Route
 * GET /api/health -> returns { status: "ok" }
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
