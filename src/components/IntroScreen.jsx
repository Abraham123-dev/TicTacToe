import { useState, useEffect } from 'react';

const TITLE_LETTERS = 'TIC-TAC-TOE'.split('');

const STEPS = [
  'intro',   // animated title + author — auto-advances
  'hook',    // what is this game?
  'rule-1',  // you can only hold 3 pieces
  'rule-2',  // oldest piece vanishes
  'ready',   // let's play
];

// Small demo board used in rule explanations
function MiniBoard({ highlight = [], faded = [], labels = {} }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 5,
        width: 120,
        height: 120,
      }}
    >
      {Array.from({ length: 9 }, (_, i) => {
        const isHighlight = highlight.includes(i);
        const isFaded = faded.includes(i);
        const label = labels[i];

        return (
          <div
            key={i}
            style={{
              borderRadius: 6,
              border: `1px solid ${isHighlight ? 'var(--color-win-border)' : isFaded ? 'var(--color-warn-border)' : 'var(--color-border)'}`,
              backgroundColor: isHighlight ? 'var(--color-win-bg)' : isFaded ? 'var(--color-warn-bg)' : 'var(--color-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: isHighlight ? 'var(--color-win-text)' : isFaded ? 'var(--color-warn)' : label === 'X' ? 'var(--color-x)' : 'var(--color-o)',
              opacity: isFaded ? 0.5 : 1,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {label || ''}
          </div>
        );
      })}
    </div>
  );
}

// Step content definitions
function StepHook() {
  return (
    <div key="hook" style={{ animation: 'step-enter 0.4s ease-out' }} className="flex flex-col items-center gap-5 text-center">
      <div style={{ fontSize: 36 }}>♟</div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', fontFamily: 'var(--font-sans)', lineHeight: 1.2 }}>
        You know Tic-Tac-Toe.
      </h2>
      <p style={{ fontSize: '1rem', color: 'var(--color-muted)', fontFamily: 'var(--font-sans)', maxWidth: 280, lineHeight: 1.6 }}>
        But we added one small rule that changes everything.
      </p>
    </div>
  );
}

function StepRule1() {
  return (
    <div key="rule1" style={{ animation: 'step-enter 0.4s ease-out' }} className="flex flex-col items-center gap-6 text-center">
      <MiniBoard
        labels={{ 0: 'X', 2: 'X', 4: 'X', 1: 'O', 3: 'O' }}
        highlight={[0, 2, 4]}
      />
      <div className="flex flex-col gap-2 items-center">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', fontFamily: 'var(--font-sans)' }}>
          Rule 1 — 3 pieces max
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', fontFamily: 'var(--font-sans)', maxWidth: 260, lineHeight: 1.6 }}>
          Each player may only have <strong style={{ color: 'var(--color-text)' }}>3 pieces</strong> on the board at any time.
        </p>
      </div>
    </div>
  );
}

function StepRule2() {
  return (
    <div key="rule2" style={{ animation: 'step-enter 0.4s ease-out' }} className="flex flex-col items-center gap-6 text-center">
      <div className="flex items-end gap-4">
        <MiniBoard
          labels={{ 0: 'X', 2: 'X', 4: 'X', 1: 'O', 3: 'O' }}
          faded={[0]}
        />
        <div style={{ color: 'var(--color-muted)', fontSize: 18, marginBottom: 48 }}>→</div>
        <MiniBoard
          labels={{ 2: 'X', 4: 'X', 6: 'X', 1: 'O', 3: 'O' }}
          highlight={[6]}
        />
      </div>
      <div className="flex flex-col gap-2 items-center">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', fontFamily: 'var(--font-sans)' }}>
          Rule 2 — Oldest piece vanishes
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', fontFamily: 'var(--font-sans)', maxWidth: 280, lineHeight: 1.6 }}>
          Place a 4th piece and your <strong style={{ color: 'var(--color-warn)' }}>oldest mark disappears</strong>. No position is ever safe.
        </p>
      </div>
    </div>
  );
}

function StepReady() {
  return (
    <div key="ready" style={{ animation: 'step-enter 0.4s ease-out' }} className="flex flex-col items-center gap-4 text-center">
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', fontFamily: 'var(--font-sans)' }}>
        You're ready.
      </h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', fontFamily: 'var(--font-sans)', maxWidth: 240, lineHeight: 1.6 }}>
        Think three moves ahead. Your opponent's block won't last forever — and neither will yours.
      </p>
    </div>
  );
}

// Intro screen — animated title
function StepIntro() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex"
        aria-label="Tic-Tac-Toe"
        style={{ gap: 1 }}
      >
        {TITLE_LETTERS.map((letter, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              fontFamily: 'var(--font-sans)',
              fontWeight: 800,
              fontSize: 'clamp(2rem, 9vw, 3.5rem)',
              letterSpacing: '-0.02em',
              color: letter === '-' ? 'var(--color-border-strong)' : 'var(--color-text)',
              opacity: 0,
              animation: `letter-rise 0.5s ease-out forwards`,
              animationDelay: `${i * 60}ms`,
              lineHeight: 1,
            }}
          >
            {letter === '-' ? <span style={{ width: '0.3em', display: 'inline-block' }}>&thinsp;</span> : letter}
          </span>
        ))}
      </div>

      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.78rem',
          color: 'var(--color-subtle)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          animation: 'author-fade 2.2s ease-out forwards',
        }}
      >
        by Abraham
      </p>
    </div>
  );
}

export default function IntroScreen({ onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  // Auto-advance from intro after animation completes
  useEffect(() => {
    if (step === 'intro') {
      const t = setTimeout(() => setStepIndex(1), 3000);
      return () => clearTimeout(t);
    }
  }, [step]);

  function handleNext() {
    if (isLast) {
      onDone();
    } else {
      setStepIndex(i => i + 1);
    }
  }

  // Progress dots (skip intro step from count)
  const contentSteps = STEPS.slice(1);
  const currentContentIdx = stepIndex - 1;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Content area */}
      <div
        className="flex flex-col items-center justify-center gap-8"
        style={{ minHeight: 320 }}
      >
        {step === 'intro'  && <StepIntro />}
        {step === 'hook'   && <StepHook />}
        {step === 'rule-1' && <StepRule1 />}
        {step === 'rule-2' && <StepRule2 />}
        {step === 'ready'  && <StepReady />}
      </div>

      {/* Navigation — hidden on intro (auto-advances) */}
      {step !== 'intro' && (
        <div
          className="flex flex-col items-center gap-5 mt-10"
          style={{ animation: 'fade-in 0.3s ease-out 0.2s both' }}
        >
          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {contentSteps.map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === currentContentIdx ? 20 : 6,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: i === currentContentIdx ? 'var(--color-text)' : 'var(--color-border-strong)',
                  transition: 'all 0.3s ease',
                  display: 'block',
                }}
              />
            ))}
          </div>

          {/* CTA button */}
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg border font-medium text-sm transition-colors duration-150"
            style={{
              fontFamily: 'var(--font-sans)',
              backgroundColor: isLast ? 'var(--color-text)' : 'var(--color-surface)',
              color: isLast ? 'var(--color-bg)' : 'var(--color-text)',
              borderColor: isLast ? 'var(--color-text)' : 'var(--color-border)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              if (!isLast) e.currentTarget.style.borderColor = 'var(--color-border-strong)';
            }}
            onMouseLeave={e => {
              if (!isLast) e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            {isLast ? 'Start playing' : 'Next'}
            <span style={{ fontSize: 14 }}>{isLast ? '→' : '›'}</span>
          </button>

          {/* Skip link — only on non-last content steps */}
          {!isLast && (
            <button
              onClick={onDone}
              className="text-xs transition-colors duration-100"
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
              Skip intro
            </button>
          )}
        </div>
      )}
    </div>
  );
}
