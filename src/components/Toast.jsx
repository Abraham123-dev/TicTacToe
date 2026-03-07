import { useState, useEffect, useCallback } from 'react';

// Toast types: 'info' | 'success' | 'warn'
const ICONS = {
  info: 'ℹ',
  success: '✓',
  warn: '⚠',
};

const COLORS = {
  info: { bg: 'var(--color-surface)', border: 'var(--color-border-strong)', text: 'var(--color-text)' },
  success: { bg: 'var(--color-win-bg)', border: 'var(--color-win-border)', text: 'var(--color-win-text)' },
  warn: { bg: 'var(--color-warn-bg)', border: 'var(--color-warn-border)', text: 'var(--color-warn)' },
};

function Toast({ message, type = 'info', onDone }) {
  const [exiting, setExiting] = useState(false);
  const colors = COLORS[type] || COLORS.info;

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 2200);
    const t2 = setTimeout(onDone, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        fontFamily: 'var(--font-sans)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        animation: exiting ? 'toast-exit 0.3s ease-in forwards' : 'toast-enter 0.3s ease-out',
        pointerEvents: 'none',
      }}
    >
      <span style={{ fontSize: 13, lineHeight: 1 }}>{ICONS[type] || ICONS.info}</span>
      {message}
    </div>
  );
}

// Global toast state — used via useToast hook
let _listeners = [];
let _toasts = [];
let _id = 0;

function notify(listeners) {
  listeners.forEach(fn => fn([..._toasts]));
}

export function showToast(message, type = 'info') {
  const id = ++_id;
  _toasts = [..._toasts, { id, message, type }];
  notify(_listeners);
  return id;
}

export function useToast() {
  const [toasts, setToasts] = useState(_toasts);

  useEffect(() => {
    _listeners.push(setToasts);
    return () => {
      _listeners = _listeners.filter(fn => fn !== setToasts);
    };
  }, []);

  const dismiss = useCallback((id) => {
    _toasts = _toasts.filter(t => t.id !== id);
    notify(_listeners);
  }, []);

  return { toasts, dismiss };
}

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-5 left-1/2 z-[999] flex flex-col items-center gap-2"
      style={{ transform: 'translateX(-50%)' }}
    >
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onDone={() => dismiss(t.id)} />
      ))}
    </div>
  );
}
