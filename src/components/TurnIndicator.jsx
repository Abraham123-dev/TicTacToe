export default function TurnIndicator({ currentPlayer, xMoves, oMoves, gameOver, gameMode, isAIThinking }) {
  if (gameOver) return null;

  const isX = currentPlayer === 'X';
  const moves = isX ? xMoves : oMoves;
  const color = isX ? 'var(--color-x)' : 'var(--color-o)';
  const willVanish = moves.length >= 3;
  const isAITurn = gameMode === 'ai' && currentPlayer === 'O';

  return (
    <div
      className="flex flex-col items-center gap-2"
      style={{ animation: 'fade-in 0.15s ease-out' }}
    >
      <div className="flex items-center gap-2">
        {isAIThinking ? (
          /* Blinking dots while AI thinks */
          <span className="flex gap-1 items-center">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1 h-1 rounded-full"
                style={{
                  backgroundColor: color,
                  animation: `pulse-soft 1s ease-in-out ${i * 200}ms infinite`,
                }}
              />
            ))}
          </span>
        ) : (
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        )}

        <span className="text-sm font-semibold" style={{ color, fontFamily: 'var(--font-sans)' }}>
          {isAITurn ? 'AI' : currentPlayer}
        </span>
        <span className="text-sm" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-sans)' }}>
          {isAIThinking ? 'thinking…' : 'to play'}
        </span>
      </div>

      {/* Piece tracker — hide while AI is thinking */}
      {!isAIThinking && (
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full border transition-all duration-150"
              style={{
                borderColor: color,
                backgroundColor: i < moves.length ? color : 'transparent',
              }}
            />
          ))}
          <span
            className="ml-1.5 text-[10px] font-medium uppercase tracking-wider"
            style={{
              color: willVanish ? 'var(--color-warn)' : 'var(--color-subtle)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {willVanish ? 'oldest will vanish' : 'pieces'}
          </span>
        </div>
      )}
    </div>
  );
}
