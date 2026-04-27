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

/**
 * Analyses the board from X's (human player) perspective
 * and returns a hint with the best move + reasoning.
 */
export function getHintForPlayer(board, xMoves, oMoves) {
  const available = board.reduce((acc, v, i) => { if (v === null) acc.push(i); return acc; }, []);
  if (available.length === 0) return null;

  const CELL_NAMES = ['top-left', 'top-center', 'top-right', 'mid-left', 'center', 'mid-right', 'bottom-left', 'bottom-center', 'bottom-right'];
  const depth = 6; // search deep for good advice

  // Check if X can win in one move
  for (const move of available) {
    const { nextBoard } = placeMarkWithVanish(board, xMoves, oMoves, move, 'X');
    const res = checkWinner(nextBoard);
    if (res && res.winner === 'X') {
      return { move, reason: `Place at ${CELL_NAMES[move]} — you win!`, type: 'win', confidence: 'high' };
    }
  }

  // Check if O can win in one move (must block)
  for (const move of available) {
    const { nextBoard } = placeMarkWithVanish(board, xMoves, oMoves, move, 'O');
    const res = checkWinner(nextBoard);
    if (res && res.winner === 'O') {
      return { move, reason: `Block ${CELL_NAMES[move]} — AI wins there next turn!`, type: 'block', confidence: 'high' };
    }
  }

  // Use minimax from X's perspective (minimizing, since minimax scores for O)
  let bestScore = Infinity;
  let bestMove = available[0];

  const scored = [];
  for (const move of available) {
    const { nextBoard, nextXMoves, nextOMoves } = placeMarkWithVanish(board, xMoves, oMoves, move, 'X');
    // After X moves, it's O's turn (maximizing for O)
    const score = minimax(nextBoard, nextXMoves, nextOMoves, true, depth, -Infinity, Infinity);
    scored.push({ move, score });
    if (score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  // Generate strategic reasoning
  let reason = '';
  let type = 'strategy';

  // Count how many lines this move contributes to
  const xLinesForMove = (m) => {
    const { nextBoard } = placeMarkWithVanish(board, xMoves, oMoves, m, 'X');
    let count = 0;
    for (const [a, b, c] of WIN_LINES) {
      const vals = [nextBoard[a], nextBoard[b], nextBoard[c]];
      const xc = vals.filter(v => v === 'X').length;
      const oc = vals.filter(v => v === 'O').length;
      if (xc >= 2 && oc === 0) count++;
    }
    return count;
  };

  const threats = xLinesForMove(bestMove);
  const vanishInfo = xMoves.length >= 3
    ? ` Your oldest piece (${CELL_NAMES[xMoves[0]]}) will vanish.`
    : '';

  if (threats >= 2) {
    reason = `Play ${CELL_NAMES[bestMove]} — creates a fork (${threats} threats)! AI can only block one.${vanishInfo}`;
    type = 'fork';
  } else if (bestMove === 4 && board[4] === null) {
    reason = `Take center — controls the most lines.${vanishInfo}`;
  } else if ([0, 2, 6, 8].includes(bestMove)) {
    reason = `Take ${CELL_NAMES[bestMove]} corner — builds diagonal pressure.${vanishInfo}`;
  } else {
    reason = `Play ${CELL_NAMES[bestMove]} — best position to set up a future fork.${vanishInfo}`;
  }

  // Check if AI's oldest piece is in a useful line (extra tip)
  let bonusTip = '';
  if (oMoves.length >= 3) {
    bonusTip = ` The AI's ${CELL_NAMES[oMoves[0]]} piece vanishes soon — plan around it.`;
  }

  return {
    move: bestMove,
    reason: reason + bonusTip,
    type,
    confidence: Math.abs(bestScore) > 500 ? 'high' : threats >= 2 ? 'high' : 'medium',
  };
}
