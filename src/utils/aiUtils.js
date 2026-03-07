import { checkWinner, placeMarkWithVanish, WIN_LINES } from './gameUtils';

/**
 * Heuristic: score the board from O's perspective.
 * Counts "open lines" — lines a player can still win through.
 */
function evaluate(board, oMoves, xMoves) {
  let score = 0;

  for (const [a, b, c] of WIN_LINES) {
    const vals = [board[a], board[b], board[c]];
    const oCount = vals.filter(v => v === 'O').length;
    const xCount = vals.filter(v => v === 'X').length;

    if (xCount === 0 && oCount > 0) score += oCount * oCount * 2; // open for O
    if (oCount === 0 && xCount > 0) score -= xCount * xCount * 2; // open for X
  }

  // Center is strategically valuable
  if (board[4] === 'O') score += 3;
  if (board[4] === 'X') score -= 3;

  // Penalise having the oldest mark in a bad position (isolated cell)
  if (oMoves.length === 3) {
    const vanishIdx = oMoves[0];
    let vanishInLine = false;
    for (const line of WIN_LINES) {
      if (line.includes(vanishIdx) && line.some(i => board[i] === 'O' && i !== vanishIdx)) {
        vanishInLine = true; break;
      }
    }
    if (!vanishInLine) score += 1; // good: the piece that vanishes is isolated
  }

  return score;
}

/**
 * Minimax with alpha-beta pruning.
 * isMaximizing = true means it's O's turn (AI).
 * Returns a numeric score from O's perspective.
 */
function minimax(board, xMoves, oMoves, isMaximizing, depth, alpha, beta) {
  const result = checkWinner(board);
  if (result) {
    // Prefer winning sooner, losing later
    return result.winner === 'O' ? 1000 + depth : -1000 - depth;
  }
  if (depth === 0) {
    return evaluate(board, oMoves, xMoves);
  }

  const player = isMaximizing ? 'O' : 'X';
  const available = board.reduce((acc, v, i) => { if (v === null) acc.push(i); return acc; }, []);

  if (available.length === 0) return evaluate(board, oMoves, xMoves);

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of available) {
      const { nextBoard, nextXMoves, nextOMoves } = placeMarkWithVanish(board, xMoves, oMoves, move, player);
      const score = minimax(nextBoard, nextXMoves, nextOMoves, false, depth - 1, alpha, beta);
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (beta <= alpha) break; // prune
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of available) {
      const { nextBoard, nextXMoves, nextOMoves } = placeMarkWithVanish(board, xMoves, oMoves, move, player);
      const score = minimax(nextBoard, nextXMoves, nextOMoves, true, depth - 1, alpha, beta);
      if (score < best) best = score;
      if (best < beta) beta = best;
      if (beta <= alpha) break; // prune
    }
    return best;
  }
}

/**
 * Returns the best cell index for the AI (playing as O).
 * depth controls strength: 1 = easy, 3 = medium, 5 = hard.
 * difficulty ('easy'|'medium'|'hard') adds randomness on lower levels.
 */
export function getAIMove(board, xMoves, oMoves, depth = 5, difficulty = 'hard') {
  const available = board.reduce((acc, v, i) => { if (v === null) acc.push(i); return acc; }, []);
  if (available.length === 0) return null;

  // On the very first move, just take center or a corner (saves minimax time)
  if (oMoves.length === 0 && xMoves.length <= 1) {
    if (board[4] === null) return 4; // center
    const corners = [0, 2, 6, 8].filter(i => board[i] === null);
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  }

  // Easy mode: 40% chance to play a random legal move
  if (difficulty === 'easy' && Math.random() < 0.4) {
    return available[Math.floor(Math.random() * available.length)];
  }

  // Medium mode: 15% chance to play a random legal move
  if (difficulty === 'medium' && Math.random() < 0.15) {
    return available[Math.floor(Math.random() * available.length)];
  }

  let bestScore = -Infinity;
  let bestMove = available[0];

  for (const move of available) {
    const { nextBoard, nextXMoves, nextOMoves } = placeMarkWithVanish(board, xMoves, oMoves, move, 'O');
    const score = minimax(nextBoard, nextXMoves, nextOMoves, false, depth, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
