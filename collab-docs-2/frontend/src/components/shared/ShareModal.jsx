import { useState, useEffect } from 'react';
import { getShares, shareDoc, updateShare, revokeShare, searchUsers } from '../../utils/api';
import { X, UserPlus, Trash2, ChevronDown } from 'lucide-react';

export default function ShareModal({ docId, docTitle, onClose }) {
  const [shares, setShares] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [permission, setPermission] = useState('view');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getShares(docId).then(r => setShares(r.data.shares));
  }, [docId]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      searchUsers(query).then(r => setResults(r.data.users));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const share = async (username) => {
    setLoading(true);
    try {
      await shareDoc(docId, username, permission);
      setMsg(`Shared with ${username} (${permission})`);
      setQuery(''); setResults([]);
      const r = await getShares(docId);
      setShares(r.data.shares);
    } catch (e) {
      setMsg(e.response?.data?.error || 'Error sharing');
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const changePermission = async (shareId, perm) => {
    await updateShare(docId, shareId, perm);
    setShares(s => s.map(x => x.id === shareId ? { ...x, permission: perm } : x));
  };

  const revoke = async (shareId, username) => {
    if (!confirm(`Remove access for ${username}?`)) return;
    await revokeShare(docId, shareId);
    setShares(s => s.filter(x => x.id !== shareId));
  };

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <div>
            <h3 style={s.title}>Share Document</h3>
            <p style={s.subtitle} title={docTitle}>{docTitle}</p>
          </div>
          <button style={s.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {/* Add collaborator */}
        <div style={s.addSection}>
          <div style={s.searchRow}>
            <div style={s.searchWrap}>
              <input
                style={s.searchInput}
                placeholder="Search username…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
              {results.length > 0 && (
                <div style={s.dropdown}>
                  {results.map(u => (
                    <button key={u.id} style={s.dropItem} onClick={() => share(u.username)}>
                      <span style={s.dropAvatar}>{u.username[0].toUpperCase()}</span>
                      {u.username}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select style={s.permSelect} value={permission} onChange={e => setPermission(e.target.value)}>
              <option value="view">Can view</option>
              <option value="edit">Can edit</option>
            </select>
          </div>
          {msg && <p style={s.msg}>{msg}</p>}
        </div>

        {/* Current shares */}
        <div style={s.shareList}>
          <p style={s.shareListLabel}>
            {shares.length === 0 ? 'No one else has access yet.' : `${shares.length} collaborator${shares.length !== 1 ? 's' : ''}`}
          </p>
          {shares.map(sh => (
            <div key={sh.id} style={s.shareItem}>
              <div style={s.shareAvatar}>{sh.username[0].toUpperCase()}</div>
              <span style={s.shareUsername}>{sh.username}</span>
              <select
                style={s.inlinePermSelect}
                value={sh.permission}
                onChange={e => changePermission(sh.id, e.target.value)}
              >
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
              </select>
              <button style={s.revokeBtn} onClick={() => revoke(sh.id, sh.username)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    background: 'white', borderRadius: 'var(--radius-lg)',
    padding: '2rem', width: '100%', maxWidth: '480px',
    boxShadow: 'var(--shadow-lg)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  title: { fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600 },
  subtitle: { fontSize: '0.8rem', color: 'var(--ink-3)', marginTop: '2px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  closeBtn: { padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' },

  addSection: { marginBottom: '1.5rem' },
  searchRow: { display: 'flex', gap: '8px' },
  searchWrap: { flex: 1, position: 'relative' },
  searchInput: {
    width: '100%', border: '1.5px solid var(--paper-3)', borderRadius: 'var(--radius)',
    padding: '0.65rem 0.9rem', fontSize: '0.9rem', outline: 'none',
    fontFamily: 'var(--font-body)', background: 'var(--paper)',
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 10,
    background: 'white', border: '1px solid var(--paper-3)',
    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)', overflow: 'hidden',
  },
  dropItem: {
    display: 'flex', alignItems: 'center', gap: '8px',
    width: '100%', padding: '0.6rem 0.9rem',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '0.9rem', textAlign: 'left',
    transition: 'background var(--transition)',
  },
  dropAvatar: {
    width: '24px', height: '24px', borderRadius: '50%',
    background: 'var(--accent)', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
  },
  permSelect: {
    border: '1.5px solid var(--paper-3)', borderRadius: 'var(--radius)',
    padding: '0.65rem 0.75rem', fontSize: '0.875rem',
    background: 'var(--paper)', cursor: 'pointer', outline: 'none',
    fontFamily: 'var(--font-body)',
  },
  msg: { marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--success)' },

  shareList: {},
  shareListLabel: { fontSize: '0.8rem', color: 'var(--ink-3)', marginBottom: '0.75rem', fontWeight: 500 },
  shareItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '0.6rem 0', borderTop: '1px solid var(--paper-2)',
  },
  shareAvatar: {
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'var(--paper-3)', color: 'var(--ink-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
  },
  shareUsername: { flex: 1, fontSize: '0.9rem', fontWeight: 500 },
  inlinePermSelect: {
    border: '1px solid var(--paper-3)', borderRadius: '6px',
    padding: '3px 8px', fontSize: '0.8rem', background: 'var(--paper)',
    cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-body)',
  },
  revokeBtn: {
    padding: '5px', borderRadius: '4px', background: 'none', border: 'none',
    cursor: 'pointer', color: 'var(--ink-4)',
    display: 'flex', alignItems: 'center',
  },
};
