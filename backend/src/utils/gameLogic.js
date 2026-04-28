/**
 * Checks if there is a winner or a draw on the TicTacToe board.
 * @param {Array} board - Array of 9 strings ("X", "O", or "").
 * @returns {string|null} "X", "O", "draw", or null if game continues.
 */
export const checkWinner = (board) => {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (board.every(cell => cell !== '')) {
    return 'draw';
  }

  return null;
};
