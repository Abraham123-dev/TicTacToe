import express from 'express';
import { googleAuth } from '../controllers/authController.js';

const router = express.Router();

/**
 * @route POST /api/auth/google
 * @desc Authenticate user with Google ID token
 */
router.post('/google', googleAuth);

export default router;
