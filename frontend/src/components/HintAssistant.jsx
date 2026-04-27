import { useState, useCallback } from 'react';

const TYPE_STYLES = {
  win:      { icon: '🏆', color: 'var(--color-win-text)', bg: 'var(--color-win-bg)', border: 'var(--color-win-border)' },
  block:    { icon: '🛡', color: 'var(--color-warn)', bg: 'var(--color-warn-bg)', border: 'var(--color-warn-border)' },
  fork:     { icon: '⚡', color: 'var(--color-win-text)', bg: 'var(--color-win-bg)', border: 'var(--color-win-border)' },
  strategy: { icon: '💡', color: 'var(--color-text)', bg: 'var(--color-surface)', border: 'var(--color-border-strong)' },
};

export default function HintAssistant({ hint, onRequestHint, onDismiss, disabled, isThinking }) {
  const [expanded, setExpanded] = useState(false);

  const handleClick = useCallback(() => {
    if (hint) {
      setExpanded(e => !e);
    } else {
      onRequestHint();
      setExpanded(true);
    }
  }, [hint, onRequestHint]);

  const handleDismiss = useCallback(() => {
    setExpanded(false);
    if (onDismiss) onDismiss();
  }, [onDismiss]);

  if (disabled) return null;

  const style = hint ? (TYPE_STYLES[hint.type] || TYPE_STYLES.strategy) : TYPE_STYLES.strategy;

  return (
    <div className="flex flex-col items-center gap-2" style={{ animation: 'fade-in 0.3s ease-out' }}>
      {/* Hint button */}
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-all duration-150"
        style={{
          fontFamily: 'var(--font-sans)',
          backgroundColor: expanded && hint ? style.bg : 'var(--color-surface)',
          color: expanded && hint ? style.color : 'var(--color-muted)',
          borderColor: expanded && hint ? style.border : 'var(--color-border)',
          cursor: 'pointer',
          opacity: isThinking ? 0.6 : 1,
        }}
        onMouseEnter={e => {
          if (!expanded) e.currentTarget.style.borderColor = 'var(--color-border-strong)';
        }}
        onMouseLeave={e => {
          if (!expanded) e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
        disabled={isThinking}
      >
        {isThinking ? (
          <>
            <span className="flex gap-0.5 items-center">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{
                    backgroundColor: 'var(--color-muted)',
                    animation: `pulse-soft 1s ease-in-out ${i * 150}ms infinite`,
                  }}
                />
              ))}
            </span>
            Analyzing…
          </>
        ) : hint && expanded ? (
          <>
            <span style={{ fontSize: 14 }}>{style.icon}</span>
            Coach says…
          </>
        ) : (
          <>
            <span style={{ fontSize: 13 }}>🤖</span>
            Ask Coach
          </>
        )}
      </button>

      {/* Hint card */}
      {hint && expanded && (
        <div
          className="flex flex-col gap-2 px-4 py-3 rounded-xl border text-left"
          style={{
            maxWidth: 320,
            backgroundColor: style.bg,
            borderColor: style.border,
            animation: 'hint-expand 0.3s ease-out',
          }}
        >
          {/* Type badge */}
          <div className="flex items-center justify-between">
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{
                color: style.color,
                backgroundColor: style.border,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {hint.type === 'win' ? 'Winning move!' :
               hint.type === 'block' ? 'Must block!' :
               hint.type === 'fork' ? 'Fork opportunity!' :
               'Best move'}
            </span>
            <span
              className="text-[9px] font-medium uppercase tracking-wider"
              style={{ color: style.color, opacity: 0.7, fontFamily: 'var(--font-sans)' }}
            >
              {hint.confidence} confidence
            </span>
          </div>

          {/* Reason text */}
          <p
            style={{
              fontSize: '0.82rem',
              color: style.color,
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.5,
            }}
          >
            {hint.reason}
          </p>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="self-end text-[10px] font-medium transition-colors duration-100"
            style={{
              color: style.color,
              opacity: 0.6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
          >
            Got it ✓
          </button>
        </div>
      )}
    </div>
  );
}
