import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

/**
 * Session Model
 * Represents a TicTacToe game session between two users.
 */
const sessionSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => nanoid(6), // Custom short unique ID
  },
  host_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  guest_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  board: {
    type: [String],
    default: Array(9).fill(''),
    validate: {
      validator: (v) => v.length === 9,
      message: 'Board must have exactly 9 cells.',
    },
  },
  x_moves: {
    type: [Number],
    default: [],
  },
  o_moves: {
    type: [Number],
    default: [],
  },
  current_turn: {
    type: String,
    enum: ['X', 'O'],
    default: 'X',
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting',
  },
  winner: {
    type: String,
    enum: ['X', 'O', 'draw', null],
    default: null,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;
