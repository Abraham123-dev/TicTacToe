import { WIN_LINES, placeMarkWithVanish } from './gameUtils';

/**
 * Generate random terrain positions for Fire vs Water mode.
 * Returns { volcano: cellIndex, ocean: cellIndex }
 * Never places on center (cell 4) — too powerful.
 */
export function generateTerrain() {
  const candidates = [0, 1, 2, 3, 5, 6, 7, 8]; // exclude center
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return { volcano: shuffled[0], ocean: shuffled[1] };
}

/**
 * Check if a piece at cellIndex is protected by terrain.
 * Fire (O) on volcano → protected. Water (X) on ocean → protected.
 */
function isTerrainProtected(cellIndex, board, terrain) {
  if (!terrain) return false;
  const piece = board[cellIndex];
  if (piece === 'O' && cellIndex === terrain.volcano) return true;
  if (piece === 'X' && cellIndex === terrain.ocean) return true;
  return false;
}

/**
 * Find all pieces that are surrounded (sandwiched) on any line.
 * Only the MIDDLE cell of each win-line can be captured.
 * Returns a Set of cell indices to remove.
 */
export function findSurroundKills(board, terrain) {
  const killed = new Set();
  for (const [a, b, c] of WIN_LINES) {
    if (
      board[a] && board[c] &&
      board[a] === board[c] &&
      board[b] && board[b] !== board[a]
    ) {
      if (!isTerrainProtected(b, board, terrain)) {
        killed.add(b);
      }
    }
  }
  return killed;
}

/**
 * Apply surround kills to the board.
 * Returns updated { board, xMoves, oMoves, killedCells }.
 */
export function applySurroundKills(board, xMoves, oMoves, terrain) {
  const killed = findSurroundKills(board, terrain);
  if (killed.size === 0) return { board, xMoves, oMoves, killedCells: [] };

  const newBoard = [...board];
  let newXMoves = [...xMoves];
  let newOMoves = [...oMoves];

  for (const idx of killed) {
    if (newBoard[idx] === 'X') {
      newXMoves = newXMoves.filter(m => m !== idx);
    } else if (newBoard[idx] === 'O') {
      newOMoves = newOMoves.filter(m => m !== idx);
    }
    newBoard[idx] = null;
  }

  return { board: newBoard, xMoves: newXMoves, oMoves: newOMoves, killedCells: [...killed] };
}

/**
 * Check for elimination win — one side has 0 pieces, the other has pieces.
 * Returns 'X' | 'O' | null.
 */
export function checkEliminationWin(board) {
  const hasX = board.some(c => c === 'X');
  const hasO = board.some(c => c === 'O');
  if (!hasX && hasO) return 'O';
  if (!hasO && hasX) return 'X';
  return null;
}

/**
 * Full fire/water move: place + vanish + surround kills.
 * Returns the complete new state after all effects.
 */
export function placeMarkFireWater(board, xMoves, oMoves, index, player, terrain) {
  // Step 1: Place mark with vanish rule
  const { nextBoard, nextXMoves, nextOMoves, vanishedIndex } = placeMarkWithVanish(
    board, xMoves, oMoves, index, player,
  );

  // Step 2: Apply surround kills on the resulting board
  const sr = applySurroundKills(nextBoard, nextXMoves, nextOMoves, terrain);

  return {
    nextBoard: sr.board,
    nextXMoves: sr.xMoves,
    nextOMoves: sr.oMoves,
    vanishedIndex,
    killedCells: sr.killedCells,
  };
}
