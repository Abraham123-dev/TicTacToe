import Cell from './Cell';

export default function Board({ board, xMoves, oMoves, currentPlayer, winningLine, gameOver, onCellClick, hintCell }) {
  // Current player's piece that will vanish on their move
  const vanishingIndex = gameOver ? null : (
    currentPlayer === 'X' && xMoves.length >= 3 ? xMoves[0] :
    currentPlayer === 'O' && oMoves.length >= 3 ? oMoves[0] :
    null
  );

  // Opponent's oldest piece — will vanish on their NEXT move
  const opponentVanishIndex = gameOver ? null : (
    currentPlayer === 'X' && oMoves.length >= 3 ? oMoves[0] :
    currentPlayer === 'O' && xMoves.length >= 3 ? xMoves[0] :
    null
  );

  return (
    <div
      className="grid gap-2 p-3 rounded-xl border"
      style={{
        gridTemplateColumns: 'repeat(3, 1fr)',
        backgroundColor: 'var(--color-bg)',
        borderColor: 'var(--color-border)',
        width: 'min(380px, 90vw)',
        aspectRatio: '1',
      }}
    >
      {board.map((value, index) => (
        <Cell
          key={index}
          value={value}
          isVanishing={vanishingIndex === index}
          isOpponentVanishing={opponentVanishIndex === index}
          isWinning={winningLine ? winningLine.includes(index) : false}
          isHinted={hintCell === index}
          onClick={() => onCellClick(index)}
          disabled={gameOver}
        />
      ))}
    </div>
  );
}
