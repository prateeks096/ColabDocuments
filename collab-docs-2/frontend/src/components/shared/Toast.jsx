import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++counterRef.current;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error:   (msg, dur) => addToast(msg, 'error', dur ?? 5000),
    info:    (msg, dur) => addToast(msg, 'info', dur),
    warn:    (msg, dur) => addToast(msg, 'warn', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// ─── UI ──────────────────────────────────────────────────────────────────────

const ICONS = {
  success: '✓',
  error:   '✕',
  warn:    '⚠',
  info:    'ℹ',
};

const COLORS = {
  success: { bg: '#f0faf4', border: '#a3d9b5', icon: 'var(--success)', text: '#1d6035' },
  error:   { bg: '#fdf2f2', border: '#f0b4b4', icon: 'var(--danger)',  text: '#8b1a1a' },
  warn:    { bg: '#fffbec', border: '#f0d87a', icon: 'var(--warn)',    text: '#7a5a00' },
  info:    { bg: '#f0f4ff', border: '#b4c8f0', icon: '#3b5fc0',        text: '#1a2f6e' },
};

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div style={s.container}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const c = COLORS[toast.type] || COLORS.info;
  return (
    <div style={{ ...s.toast, background: c.bg, borderColor: c.border }}>
      <span style={{ ...s.icon, color: c.icon }}>{ICONS[toast.type]}</span>
      <span style={{ ...s.msg, color: c.text }}>{toast.message}</span>
      <button style={s.close} onClick={() => onDismiss(toast.id)}>×</button>
    </div>
  );
}

const s = {
  container: {
    position: 'fixed', bottom: '1.5rem', right: '1.5rem',
    zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px',
    maxWidth: '360px', width: '100%',
  },
  toast: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    padding: '0.75rem 1rem', borderRadius: 'var(--radius)',
    border: '1px solid', boxShadow: 'var(--shadow-md)',
    animation: 'slideInToast 200ms ease',
  },
  icon: { fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, lineHeight: 1.5 },
  msg:  { flex: 1, fontSize: '0.875rem', lineHeight: 1.5 },
  close: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '1.1rem', lineHeight: 1, opacity: 0.5, flexShrink: 0,
    padding: '0 2px',
  },
};
