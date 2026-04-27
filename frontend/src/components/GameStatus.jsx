export default function GameStatus({ winner, isDraw, onPlayAgain }) {
  if (!winner && !isDraw) return null;

  const isDrawResult = isDraw && !winner;
  const color = winner === 'X' ? 'var(--color-x)' : winner === 'O' ? 'var(--color-o)' : 'var(--color-text)';

  return (
    <div
      className="flex items-center gap-4 rounded-xl border px-6 py-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        animation: 'slide-up 0.25s ease-out',
      }}
    >
      <p
        className="font-semibold"
        style={{
          color,
          fontFamily: 'var(--font-sans)',
          fontSize: '0.95rem',
          letterSpacing: '-0.01em',
        }}
      >
        {isDrawResult ? "It's a draw" : `${winner} wins`}
      </p>

      <div style={{ width: 1, height: 20, backgroundColor: 'var(--color-border)' }} />

      <button
        onClick={onPlayAgain}
        className="text-sm font-medium transition-colors duration-100"
        style={{
          color: 'var(--color-muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          padding: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
      >
        Play again
      </button>
    </div>
  );
}
