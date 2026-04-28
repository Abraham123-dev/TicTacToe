import express from 'express';
import * as sessionController from '../controllers/sessionController.js';

const router = express.Router();

/**
 * @route POST /api/session/create
 * @desc Create a new game session
 */
router.post('/create', sessionController.createSession);

/**
 * @route POST /api/session/join
 * @desc Join an existing game session
 */
router.post('/join', sessionController.joinSession);

/**
 * @route GET /api/session/:id
 * @desc Get details of a specific session
 */
router.get('/:id', sessionController.getSession);

export default router;
