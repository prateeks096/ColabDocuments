import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    try {
      await login(username.trim());
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoMark}>✦</span>
          <h1 style={styles.logoText}>Collab Docs</h1>
        </div>
        <p style={styles.tagline}>
          A quiet space to write and share.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Choose a username to get started</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="e.g. prateek"
            style={styles.input}
            maxLength={32}
            autoFocus
            autoComplete="off"
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading || !username.trim()} style={styles.btn}>
            {loading ? 'Entering…' : 'Enter'}
          </button>
        </form>

        <p style={styles.hint}>No password. No email. Just write.</p>
      </div>

      {/* Decorative background */}
      <div style={styles.bg1} />
      <div style={styles.bg2} />
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    background: 'var(--paper)',
  },
  bg1: {
    position: 'absolute', top: '-120px', right: '-120px',
    width: '500px', height: '500px', borderRadius: '50%',
    background: 'radial-gradient(circle, #f9ddd0 0%, transparent 70%)',
    zIndex: 0,
  },
  bg2: {
    position: 'absolute', bottom: '-80px', left: '-80px',
    width: '360px', height: '360px', borderRadius: '50%',
    background: 'radial-gradient(circle, #ede9e0 0%, transparent 70%)',
    zIndex: 0,
  },
  card: {
    position: 'relative', zIndex: 1,
    background: 'white',
    border: '1px solid var(--paper-3)',
    borderRadius: 'var(--radius-lg)',
    padding: '3rem 2.5rem',
    width: '100%', maxWidth: '420px',
    boxShadow: 'var(--shadow-lg)',
    textAlign: 'center',
  },
  logo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '0.5rem' },
  logoMark: { fontSize: '1.8rem', color: 'var(--accent)' },
  logoText: { fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 600, color: 'var(--ink)' },
  tagline: { color: 'var(--ink-3)', fontSize: '0.95rem', marginBottom: '2.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' },
  label: { fontSize: '0.85rem', color: 'var(--ink-2)', fontWeight: 500, marginBottom: '0.25rem' },
  input: {
    border: '1.5px solid var(--paper-3)',
    borderRadius: 'var(--radius)',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    background: 'var(--paper)',
    color: 'var(--ink)',
    transition: 'border-color var(--transition)',
    outline: 'none',
  },
  btn: {
    marginTop: '0.5rem',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius)',
    padding: '0.8rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background var(--transition)',
  },
  error: { color: 'var(--danger)', fontSize: '0.85rem' },
  hint: { marginTop: '1.75rem', fontSize: '0.8rem', color: 'var(--ink-4)' },
};
