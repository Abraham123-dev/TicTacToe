import { useState } from 'react';

export default function GameHeader() {
  const [showRule, setShowRule] = useState(false);

  return (
    <header className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <h1
          className="font-bold tracking-tight"
          style={{
            fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '-0.02em',
          }}
        >
          Vanishing Moves
        </h1>

        <div className="relative">
          <button
            aria-label="How to play"
            className="flex items-center justify-center w-[18px] h-[18px] rounded-full border text-[10px] font-semibold transition-colors duration-100"
            style={{
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-muted)',
              backgroundColor: 'var(--color-surface)',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-text)'; setShowRule(true); }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; setShowRule(false); }}
          >
            ?
          </button>

          {showRule && (
            <div
              className="absolute left-1/2 top-6 z-10 w-60 rounded-lg border p-3 text-xs leading-relaxed"
              style={{
                transform: 'translateX(-50%)',
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-muted)',
                animation: 'fade-in 0.12s ease-out',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}
            >
              Each player may only keep{' '}
              <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>3 pieces</span>{' '}
              on the board. Placing a 4th removes your oldest piece.
              <span style={{ color: 'var(--color-warn)', fontWeight: 500 }}> Plan ahead.</span>
            </div>
          )}
        </div>
      </div>

      <p
        className="text-xs"
        style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-sans)', letterSpacing: '0.01em' }}
      >
        Tic-tac-toe with a twist
      </p>
    </header>
  );
}
