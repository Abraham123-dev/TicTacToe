import { checkWinner, placeMarkWithVanish, WIN_LINES } from './gameUtils';
import { placeMarkFireWater, checkEliminationWin } from './fireWaterUtils';

/**
 * Heuristic: score the board from O's perspective.
 * Counts "open lines" — lines a player can still win through.
 * Enhanced with fork detection and vanish-cycle awareness.
 */
function evaluate(board, oMoves, xMoves) {
  let score = 0;

  let xThreats = 0; // lines where X has 2 and O has 0
  let oThreats = 0; // lines where O has 2 and X has 0

  for (const [a, b, c] of WIN_LINES) {
    const vals = [board[a], board[b], board[c]];
    const oCount = vals.filter(v => v === 'O').length;
    const xCount = vals.filter(v => v === 'X').length;

    if (xCount === 0 && oCount > 0) {
      score += oCount * oCount * 2; // open for O
      if (oCount >= 2) oThreats++;
    }
    if (oCount === 0 && xCount > 0) {
      score -= xCount * xCount * 2; // open for X
      if (xCount >= 2) xThreats++;
    }
  }

  // Fork bonus/penalty (double threats are devastating)
  if (oThreats >= 2) score += 15;
  if (xThreats >= 2) score -= 15;

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

  // Same for X's vanishing piece
  if (xMoves.length === 3) {
    const vanishIdx = xMoves[0];
    let vanishInLine = false;
    for (const line of WIN_LINES) {
      if (line.includes(vanishIdx) && line.some(i => board[i] === 'X' && i !== vanishIdx)) {
        vanishInLine = true; break;
      }
    }
    if (!vanishInLine) score -= 1; // bad for O: X's vanishing piece is isolated (X benefits)
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
 * Uses depth 9 — deeper than Hard AI's depth 5 — to outplay it.
 * Also runs a secondary simulation predicting the AI's responses.
 */
export function getHintForPlayer(board, xMoves, oMoves) {
  const available = board.reduce((acc, v, i) => { if (v === null) acc.push(i); return acc; }, []);
  if (available.length === 0) return null;

  const CELL_NAMES = ['top-left', 'top-center', 'top-right', 'mid-left', 'center', 'mid-right', 'bottom-left', 'bottom-center', 'bottom-right'];
  const HINT_DEPTH = 9; // much deeper than hard AI (depth 5)

  // ── Immediate win check ──
  for (const move of available) {
    const { nextBoard } = placeMarkWithVanish(board, xMoves, oMoves, move, 'X');
    const res = checkWinner(nextBoard);
    if (res && res.winner === 'X') {
      return { move, reason: `Place at ${CELL_NAMES[move]} — you win immediately!`, type: 'win', confidence: 'high' };
    }
  }

  // ── Must-block check (AI wins next) ──
  const blocks = [];
  for (const move of available) {
    const { nextBoard } = placeMarkWithVanish(board, xMoves, oMoves, move, 'O');
    const res = checkWinner(nextBoard);
    if (res && res.winner === 'O') {
      blocks.push(move);
    }
  }
  if (blocks.length === 1) {
    return { move: blocks[0], reason: `Block ${CELL_NAMES[blocks[0]]} — AI wins there next turn!`, type: 'block', confidence: 'high' };
  }
  if (blocks.length >= 2) {
    // Multiple threats — we're likely losing, find the best damage control via deep search
  }

  // ── Deep minimax from X's perspective (depth 9) ──
  // X wants to MINIMIZE the score (since minimax scores favour O)
  const scored = [];
  for (const move of available) {
    const { nextBoard, nextXMoves, nextOMoves } = placeMarkWithVanish(board, xMoves, oMoves, move, 'X');
    const result = checkWinner(nextBoard);
    if (result && result.winner === 'X') {
      scored.push({ move, score: -2000 }); // already caught above, but just in case
      continue;
    }
    const score = minimax(nextBoard, nextXMoves, nextOMoves, true, HINT_DEPTH, -Infinity, Infinity);
    scored.push({ move, score });
  }
  scored.sort((a, b) => a.score - b.score); // lowest = best for X

  const bestMove = scored[0].move;
  const bestScore = scored[0].score;

  // ── Simulate: what does the AI (hard, depth 5) do after our move? ──
  const { nextBoard: afterX, nextXMoves: xmAfter, nextOMoves: omAfter } = placeMarkWithVanish(board, xMoves, oMoves, bestMove, 'X');
  const aiResponse = getAIMove(afterX, xmAfter, omAfter, 5, 'hard');
  const aiResponseName = aiResponse !== null ? CELL_NAMES[aiResponse] : null;

  // ── After AI responds, do we have a winning follow-up? ──
  let followUp = null;
  if (aiResponse !== null) {
    const { nextBoard: afterAI, nextXMoves: xm2, nextOMoves: om2 } = placeMarkWithVanish(afterX, xmAfter, omAfter, aiResponse, 'O');
    const avail2 = afterAI.reduce((acc, v, i) => { if (v === null) acc.push(i); return acc; }, []);
    for (const m2 of avail2) {
      const { nextBoard: afterX2 } = placeMarkWithVanish(afterAI, xm2, om2, m2, 'X');
      const r2 = checkWinner(afterX2);
      if (r2 && r2.winner === 'X') {
        followUp = { move: m2, name: CELL_NAMES[m2] };
        break;
      }
    }
  }

  // ── Count threats created by this move ──
  const countThreats = (m) => {
    const { nextBoard: nb } = placeMarkWithVanish(board, xMoves, oMoves, m, 'X');
    let threats = 0;
    for (const [a, b, c] of WIN_LINES) {
      const vals = [nb[a], nb[b], nb[c]];
      const xc = vals.filter(v => v === 'X').length;
      const oc = vals.filter(v => v === 'O').length;
      if (xc >= 2 && oc === 0) threats++;
    }
    return threats;
  };

  const threats = countThreats(bestMove);

  // ── Vanish info ──
  const xVanish = xMoves.length >= 3 ? CELL_NAMES[xMoves[0]] : null;
  const oVanish = oMoves.length >= 3 ? CELL_NAMES[oMoves[0]] : null;

  // ── Build reason string ──
  let type = 'strategy';
  let reason = '';

  if (threats >= 2) {
    type = 'fork';
    reason = `Play ${CELL_NAMES[bestMove]} — creates a fork with ${threats} threats. The AI can only block one!`;
  } else if (bestScore <= -800) {
    type = 'win';
    reason = `Play ${CELL_NAMES[bestMove]} — this leads to a forced win within a few moves!`;
  } else if (blocks.length >= 2) {
    type = 'block';
    reason = `Play ${CELL_NAMES[bestMove]} — AI has double threats. This is the best damage control.`;
  } else if (bestMove === 4 && board[4] === null) {
    reason = `Take center — it controls the most lines and sets up future forks.`;
  } else if ([0, 2, 6, 8].includes(bestMove)) {
    reason = `Take ${CELL_NAMES[bestMove]} corner — builds diagonal and edge pressure.`;
  } else {
    reason = `Play ${CELL_NAMES[bestMove]} — best position to outmaneuver the AI.`;
  }

  // Add vanish context
  if (xVanish) {
    reason += ` (Your ${xVanish} piece vanishes)`;
  }

  // Add prediction of AI response
  if (aiResponseName) {
    reason += ` → AI will likely play ${aiResponseName}.`;
  }

  // Add follow-up win if found
  if (followUp) {
    reason += ` Then play ${followUp.name} to win!`;
    if (type === 'strategy') type = 'fork';
  }

  // Add exploit tip for AI's vanishing piece
  if (oVanish && type !== 'win') {
    reason += ` Tip: AI's ${oVanish} piece vanishes soon — attack that area.`;
  }

  // Confidence based on score
  const confidence = bestScore <= -500 ? 'high' : threats >= 2 ? 'high' : bestScore <= -50 ? 'medium' : 'medium';

  return { move: bestMove, reason, type, confidence };
}
