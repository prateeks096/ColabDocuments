import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={s.wrap}>
        <div style={s.card}>
          <div style={s.icon}>⚠</div>
          <h2 style={s.title}>Something went wrong</h2>
          <p style={s.msg}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <div style={s.actions}>
            <button style={s.btn} onClick={() => this.setState({ hasError: false, error: null })}>
              Try again
            </button>
            <button style={s.btnSecondary} onClick={() => window.location.href = '/'}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const s = {
  wrap: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--paper)', padding: '2rem',
  },
  card: {
    background: 'white', border: '1px solid var(--paper-3)',
    borderRadius: 'var(--radius-lg)', padding: '3rem 2.5rem',
    maxWidth: '420px', width: '100%', textAlign: 'center',
    boxShadow: 'var(--shadow-lg)',
  },
  icon: { fontSize: '2.5rem', marginBottom: '1rem' },
  title: { fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '0.75rem' },
  msg: { color: 'var(--ink-3)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 },
  actions: { display: 'flex', gap: '10px', justifyContent: 'center' },
  btn: {
    padding: '0.65rem 1.25rem', borderRadius: 'var(--radius)',
    background: 'var(--accent)', color: 'white', border: 'none',
    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  btnSecondary: {
    padding: '0.65rem 1.25rem', borderRadius: 'var(--radius)',
    background: 'none', color: 'var(--ink-2)',
    border: '1.5px solid var(--paper-3)',
    fontSize: '0.875rem', cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
};
