import Cell from './Cell';

export default function Board({ board, xMoves, oMoves, currentPlayer, winningLine, gameOver, onCellClick }) {
  const vanishingIndex = gameOver ? null : (
    currentPlayer === 'X' && xMoves.length >= 3 ? xMoves[0] :
    currentPlayer === 'O' && oMoves.length >= 3 ? oMoves[0] :
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
          isWinning={winningLine ? winningLine.includes(index) : false}
          onClick={() => onCellClick(index)}
          disabled={gameOver}
        />
      ))}
    </div>
  );
}
