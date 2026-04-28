import { useState, useEffect, useRef } from 'react';

export default function GameSettingsPanel({
  isOpen,
  onClose,
  gameMode,
  onModeChange,
  difficulty,
  onDifficultyChange,
  onNewGame,
  onBackToIntro,
  onShowFullIntro,
}) {
  const panelRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    // Delay the listener so the toggle click doesn't immediately close
    const t = setTimeout(() => document.addEventListener('mousedown', handleClick), 10);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const difficulties = [
    { value: 'easy', label: 'Easy', desc: 'Forgiving' },
    { value: 'medium', label: 'Medium', desc: 'Balanced' },
    { value: 'hard', label: 'Hard', desc: 'Ruthless' },
  ];

  const modes = [
    { value: 'ai', label: 'vs AI', desc: 'Minimax engine' },
    { value: 'human', label: 'vs Friend', desc: 'Same device' },
  ];

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-8 z-50 flex flex-col gap-4 rounded-xl border p-5"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: 260,
        animation: 'settings-enter 0.2s ease-out',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-sans)' }}
        >
          Settings
        </span>
        <button
          onClick={onClose}
          aria-label="Close settings"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-subtle)',
            fontSize: 16,
            fontFamily: 'var(--font-sans)',
            padding: '2px 4px',
            borderRadius: 4,
            lineHeight: 1,
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-subtle)'}
        >
          ✕
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: 'var(--color-border)' }} />

      {/* Game mode */}
      <div className="flex flex-col gap-2">
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-sans)' }}
        >
          Game Mode
        </span>
        <div
          className="flex rounded-lg border overflow-hidden"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {modes.map((opt, i) => (
            <button
              key={opt.value}
              onClick={() => onModeChange(opt.value)}
              className="flex flex-col items-center flex-1 px-3 py-2 text-xs font-medium transition-colors duration-100"
              style={{
                fontFamily: 'var(--font-sans)',
                backgroundColor: gameMode === opt.value ? 'var(--color-text)' : 'var(--color-surface)',
                color: gameMode === opt.value ? 'var(--color-bg)' : 'var(--color-muted)',
                border: 'none',
                cursor: 'pointer',
                borderRight: i === 0 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <span style={{ fontWeight: 600 }}>{opt.label}</span>
              <span style={{ fontSize: '0.6rem', opacity: 0.7, marginTop: 1 }}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty — only when vs AI */}
      {gameMode === 'ai' && (
        <div className="flex flex-col gap-2" style={{ animation: 'fade-in 0.2s ease-out' }}>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-sans)' }}
          >
            Difficulty
          </span>
          <div
            className="flex rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {difficulties.map((opt, i, arr) => (
              <button
                key={opt.value}
                onClick={() => onDifficultyChange(opt.value)}
                className="flex flex-col items-center flex-1 px-3 py-2 text-xs font-medium transition-colors duration-100"
                style={{
                  fontFamily: 'var(--font-sans)',
                  backgroundColor: difficulty === opt.value ? 'var(--color-text)' : 'var(--color-surface)',
                  color: difficulty === opt.value ? 'var(--color-bg)' : 'var(--color-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  borderRight: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>{opt.label}</span>
                <span style={{ fontSize: '0.6rem', opacity: 0.7, marginTop: 1 }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: 'var(--color-border)' }} />

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => { onNewGame(); onClose(); }}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border text-xs font-semibold transition-colors duration-100"
          style={{
            fontFamily: 'var(--font-sans)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            borderColor: 'var(--color-border)',
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
        >
          <span style={{ fontSize: 12 }}>↻</span>
          New Game
        </button>

        <button
          onClick={() => { onShowFullIntro(); onClose(); }}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-xs font-medium transition-colors duration-100"
          style={{
            fontFamily: 'var(--font-sans)',
            background: 'none',
            color: 'var(--color-subtle)',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-muted)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-subtle)'}
        >
          <span style={{ fontSize: 12 }}>❓</span>
          How to Play
        </button>

        <button
          onClick={() => { onBackToIntro(); onClose(); }}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-xs font-medium transition-colors duration-100 opacity-60"
          style={{
            fontFamily: 'var(--font-sans)',
            background: 'none',
            color: 'var(--color-subtle)',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-muted)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-subtle)'}
        >
          ← Back to menu
        </button>
      </div>
    </div>
  );
}
