import ThemeToggle from './ThemeToggle';

export default function NotFound() {
  return (
    <>
      <ThemeToggle />
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: 'var(--color-bg)', fontFamily: 'var(--font-sans)' }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>♟</div>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--color-text)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            marginBottom: 8
          }}
        >
          404 - Lost in the Grid
        </h1>
        <p
          style={{
            fontSize: '1rem',
            color: 'var(--color-muted)',
            maxWidth: 320,
            lineHeight: 1.6,
            marginBottom: 32
          }}
        >
          The page you are looking for has vanished, just like a 4th piece on the board.
        </p>
        
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 px-6 py-3 rounded-lg border font-medium text-sm transition-colors duration-150"
          style={{
            backgroundColor: 'var(--color-text)',
            color: 'var(--color-bg)',
            borderColor: 'var(--color-text)',
            cursor: 'pointer',
          }}
        >
          Return to game
          <span style={{ fontSize: 14 }}>→</span>
        </button>
      </div>
    </>
  );
}
