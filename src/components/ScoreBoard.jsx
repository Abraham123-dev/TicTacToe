export default function ScoreBoard({ scores, onReset, gameMode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="text-[10px] font-medium uppercase tracking-widest"
            style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-sans)' }}
          >
            X
          </span>
          <span
            className="font-bold tabular-nums"
            style={{
              fontSize: '2rem',
              color: 'var(--color-x)',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {scores.X}
          </span>
        </div>

        <div style={{ width: 1, height: 36, backgroundColor: 'var(--color-border)' }} />

        <div className="flex flex-col items-center gap-0.5">
          <span
            className="text-[10px] font-medium uppercase tracking-widest"
            style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-sans)' }}
          >
            {gameMode === 'ai' ? 'AI' : 'O'}
          </span>
          <span
            className="font-bold tabular-nums"
            style={{
              fontSize: '2rem',
              color: 'var(--color-o)',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {scores.O}
          </span>
        </div>
      </div>

      <button
        onClick={onReset}
        className="text-[10px] font-medium tracking-wider uppercase transition-colors duration-100"
        style={{
          color: 'var(--color-subtle)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-muted)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-subtle)'}
      >
        Reset scores
      </button>
    </div>
  );
}
