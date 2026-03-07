export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

/**
 * Returns { winner: 'X'|'O', line: number[] } or null.
 */
export function checkWinner(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

/**
 * Place a mark, applying the vanishing rule (max 3 per player).
 * Returns { nextBoard, nextXMoves, nextOMoves, vanishedIndex }
 */
export function placeMarkWithVanish(board, xMoves, oMoves, index, player) {
  const nextBoard = [...board];
  let nextXMoves = [...xMoves];
  let nextOMoves = [...oMoves];
  let vanishedIndex = null;

  if (player === 'X') {
    if (nextXMoves.length >= 3) {
      vanishedIndex = nextXMoves[0];
      nextBoard[vanishedIndex] = null;
      nextXMoves = nextXMoves.slice(1);
    }
    nextBoard[index] = 'X';
    nextXMoves = [...nextXMoves, index];
  } else {
    if (nextOMoves.length >= 3) {
      vanishedIndex = nextOMoves[0];
      nextBoard[vanishedIndex] = null;
      nextOMoves = nextOMoves.slice(1);
    }
    nextBoard[index] = 'O';
    nextOMoves = [...nextOMoves, index];
  }

  return { nextBoard, nextXMoves, nextOMoves, vanishedIndex };
}

/**
 * Returns the index of the cell that will vanish next for a player (oldest mark).
 * Returns null if player has fewer than 3 marks.
 */
export function getVanishingIndex(moves) {
  return moves.length >= 3 ? moves[0] : null;
}
