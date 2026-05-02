import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDocSearch } from '../hooks/useDocSearch';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useToast } from '../components/shared/Toast';
import { DashboardSkeleton } from '../components/shared/Skeletons';
import { getMyDocs, getSharedDocs, createDoc, deleteDoc, uploadDoc, updateDoc } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import {
  FilePlus, Upload, LogOut, FileText, Users, Trash2,
  Pencil, Check, X, ChevronRight, Search, Menu
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState('mine');
  const [myDocs, setMyDocs] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef();

  const docs = tab === 'mine' ? myDocs : sharedDocs;
  const { query, setQuery, filtered } = useDocSearch(docs);

  const load = async () => {
    setLoading(true);
    try {
      const [mine, shared] = await Promise.all([getMyDocs(), getSharedDocs()]);
      setMyDocs(mine.data.docs);
      setSharedDocs(shared.data.docs);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleNew = async () => {
    try {
      const { data } = await createDoc({ title: 'Untitled Document' });
      navigate(`/docs/${data.doc.id}`);
    } catch {
      toast.error('Could not create document');
    }
  };

  const handleDelete = async (e, id, title) => {
    e.stopPropagation();
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(id);
      setMyDocs(d => d.filter(x => x.id !== id));
      toast.success('Document deleted');
    } catch {
      toast.error('Could not delete document');
    }
  };

  const startRename = (e, doc) => {
    e.stopPropagation();
    setRenamingId(doc.id);
    setRenameVal(doc.title);
  };

  const commitRename = async (e, docId) => {
    e?.stopPropagation();
    const trimmed = renameVal.trim();
    if (trimmed) {
      try {
        await updateDoc(docId, { title: trimmed });
        setMyDocs(d => d.map(x => x.id === docId ? { ...x, title: trimmed } : x));
        toast.success('Renamed');
      } catch {
        toast.error('Rename failed');
      }
    }
    setRenamingId(null);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { data } = await uploadDoc(file);
      toast.success(`"${data.doc.title}" uploaded`);
      navigate(`/docs/${data.doc.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    }
    e.target.value = '';
  };

  useKeyboardShortcuts([
    { key: 'n', ctrl: true, action: handleNew },
    { key: 'u', ctrl: true, action: () => fileInputRef.current?.click() },
  ]);

  const permLabel = { owner: 'Owner', edit: 'Can edit', view: 'View only' };
  const permColor = { owner: 'var(--accent)', edit: 'var(--success)', view: 'var(--ink-3)' };
  const typeIcon  = { markdown: '⌗', plaintext: '≡', richtext: '¶' };

  return (
    <div style={s.page}>
      {sidebarOpen && <div style={s.overlay} onClick={() => setSidebarOpen(false)} />}

      <aside style={{ ...s.sidebar, ...(sidebarOpen ? s.sidebarOpen : {}) }}>
        <div style={s.brand}>
          <span style={s.brandMark}>✦</span>
          <span style={s.brandName}>Collab Docs</span>
        </div>
        <div style={s.userBadge}>
          <div style={s.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
          <span style={s.username}>{user?.username}</span>
        </div>
        <div style={s.navGroup}>
          <button style={{ ...s.navBtn, ...(tab === 'mine' ? s.navBtnActive : {}) }}
            onClick={() => { setTab('mine'); setSidebarOpen(false); }}>
            <FileText size={15} /> My Documents
            <span style={s.navCount}>{myDocs.length}</span>
          </button>
          <button style={{ ...s.navBtn, ...(tab === 'shared' ? s.navBtnActive : {}) }}
            onClick={() => { setTab('shared'); setSidebarOpen(false); }}>
            <Users size={15} /> Shared with Me
            <span style={s.navCount}>{sharedDocs.length}</span>
          </button>
        </div>
        <div style={s.shortcuts}>
          <p style={s.shortcutLabel}>Shortcuts</p>
          <div style={s.shortcutRow}><kbd style={s.kbd}>⌘N</kbd><span>New doc</span></div>
          <div style={s.shortcutRow}><kbd style={s.kbd}>⌘U</kbd><span>Upload</span></div>
          <div style={s.shortcutRow}><kbd style={s.kbd}>⌘S</kbd><span>Save (editor)</span></div>
          <div style={s.shortcutRow}><kbd style={s.kbd}>⌘⇧K</kbd><span>Share (editor)</span></div>
        </div>
        <div style={s.sidebarBottom}>
          <button style={s.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <main style={s.main}>
        <div style={s.mobileBar}>
          <button style={s.menuBtn} onClick={() => setSidebarOpen(v => !v)}><Menu size={20} /></button>
          <span style={s.mobileBrand}>✦ Collab Docs</span>
        </div>

        <div style={s.header}>
          <div>
            <h2 style={s.pageTitle}>{tab === 'mine' ? 'My Documents' : 'Shared with Me'}</h2>
            <p style={s.pageSubtitle}>{filtered.length} of {docs.length} document{docs.length !== 1 ? 's' : ''}</p>
          </div>
          {tab === 'mine' && (
            <div style={s.actions}>
              <button style={s.uploadBtn} onClick={() => fileInputRef.current?.click()} title="Upload .txt or .md (⌘U)">
                <Upload size={14} /> Upload
              </button>
              <input ref={fileInputRef} type="file" accept=".txt,.md" style={{ display: 'none' }} onChange={handleUpload} />
              <button style={s.newBtn} onClick={handleNew} title="New document (⌘N)">
                <FilePlus size={14} /> New Document
              </button>
            </div>
          )}
        </div>

        <div style={s.searchWrap}>
          <Search size={15} style={s.searchIcon} />
          <input
            style={s.searchInput}
            placeholder={`Search ${tab === 'mine' ? 'your' : 'shared'} documents…`}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && <button style={s.clearBtn} onClick={() => setQuery('')}><X size={13} /></button>}
        </div>

        {loading ? <DashboardSkeleton /> : filtered.length === 0 ? (
          <div style={s.emptyState}>
            {query ? (
              <>
                <Search size={40} color="var(--paper-3)" />
                <p style={s.emptyTitle}>No results for "{query}"</p>
                <button style={s.clearSearchBtn} onClick={() => setQuery('')}>Clear search</button>
              </>
            ) : (
              <>
                <FileText size={48} color="var(--paper-3)" />
                <p style={s.emptyTitle}>{tab === 'mine' ? 'No documents yet' : 'Nothing shared with you'}</p>
                {tab === 'mine' && <button style={s.newBtn} onClick={handleNew}><FilePlus size={14} /> Create your first doc</button>}
              </>
            )}
          </div>
        ) : (
          <div style={s.grid}>
            {filtered.map(doc => (
              <div key={doc.id} style={s.card}
                onClick={() => navigate(`/docs/${doc.id}`)}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}>
                <div style={s.cardIcon}>{typeIcon[doc.contentType] ?? '¶'}</div>
                <div style={s.cardBody}>
                  {renamingId === doc.id ? (
                    <div style={s.renameRow} onClick={e => e.stopPropagation()}>
                      <input style={s.renameInput} value={renameVal} autoFocus
                        onChange={e => setRenameVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') commitRename(null, doc.id); if (e.key === 'Escape') setRenamingId(null); }} />
                      <button style={s.iconBtn} onClick={e => commitRename(e, doc.id)}><Check size={13} color="var(--success)" /></button>
                      <button style={s.iconBtn} onClick={e => { e.stopPropagation(); setRenamingId(null); }}><X size={13} color="var(--ink-3)" /></button>
                    </div>
                  ) : <h3 style={s.docTitle}>{doc.title}</h3>}
                  <div style={s.docMeta}>
                    <span style={{ ...s.permBadge, color: permColor[doc.permission] }}>{permLabel[doc.permission]}</span>
                    {doc.permission !== 'owner' && <span style={s.docOwner}>by {doc.owner}</span>}
                    <span style={s.docDate}>{formatDistanceToNow(new Date(doc.updatedAt * 1000), { addSuffix: true })}</span>
                  </div>
                </div>
                {doc.permission === 'owner' && (
                  <div style={s.cardActions} onClick={e => e.stopPropagation()}>
                    <button style={s.iconBtn} title="Rename" onClick={e => startRename(e, doc)}><Pencil size={13} /></button>
                    <button style={s.iconBtn} title="Delete" onClick={e => handleDelete(e, doc.id, doc.title)}><Trash2 size={13} color="var(--danger)" /></button>
                  </div>
                )}
                <ChevronRight size={15} color="var(--ink-4)" style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes slideInToast { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
        @media (max-width: 700px) {
          .main-content { padding: 1.25rem !important; }
        }
      `}</style>
    </div>
  );
}

const s = {
  page: { display:'flex', minHeight:'100vh', background:'var(--paper)', position:'relative' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', zIndex:49 },
  sidebar: {
    width:'240px', flexShrink:0, background:'white', borderRight:'1px solid var(--paper-3)',
    display:'flex', flexDirection:'column', padding:'1.5rem 1rem',
    position:'sticky', top:0, height:'100vh',
  },
  sidebarOpen: { position:'fixed', top:0, left:0, height:'100vh', zIndex:50, boxShadow:'var(--shadow-lg)' },
  brand: { display:'flex', alignItems:'center', gap:'8px', marginBottom:'2rem', padding:'0 0.5rem' },
  brandMark: { fontSize:'1.25rem', color:'var(--accent)' },
  brandName: { fontFamily:'var(--font-serif)', fontSize:'1.1rem', fontWeight:600 },
  userBadge: { display:'flex', alignItems:'center', gap:'10px', background:'var(--paper)', borderRadius:'var(--radius)', padding:'0.6rem 0.75rem', marginBottom:'1.5rem' },
  avatar: { width:'30px', height:'30px', borderRadius:'50%', background:'var(--accent)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:700, flexShrink:0 },
  username: { fontSize:'0.875rem', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  navGroup: { display:'flex', flexDirection:'column', gap:'4px' },
  navBtn: { display:'flex', alignItems:'center', gap:'8px', padding:'0.6rem 0.75rem', borderRadius:'var(--radius)', fontSize:'0.875rem', color:'var(--ink-2)', cursor:'pointer', background:'none', border:'none', textAlign:'left', fontFamily:'var(--font-body)', transition:'background var(--transition)' },
  navBtnActive: { background:'var(--accent-bg)', color:'var(--accent)', fontWeight:600 },
  navCount: { marginLeft:'auto', background:'var(--paper-2)', borderRadius:'999px', padding:'1px 7px', fontSize:'0.72rem', color:'var(--ink-3)' },
  shortcuts: { marginTop:'2rem', borderTop:'1px solid var(--paper-2)', paddingTop:'1rem', padding:'1rem 0.5rem 0' },
  shortcutLabel: { fontSize:'0.68rem', color:'var(--ink-4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.6rem' },
  shortcutRow: { display:'flex', alignItems:'center', gap:'8px', marginBottom:'0.4rem', fontSize:'0.75rem', color:'var(--ink-3)' },
  kbd: { fontFamily:'var(--font-mono)', fontSize:'0.68rem', background:'var(--paper-2)', border:'1px solid var(--paper-3)', borderRadius:'4px', padding:'1px 5px', color:'var(--ink-2)' },
  sidebarBottom: { marginTop:'auto' },
  logoutBtn: { display:'flex', alignItems:'center', gap:'8px', padding:'0.6rem 0.75rem', borderRadius:'var(--radius)', fontSize:'0.85rem', color:'var(--ink-3)', cursor:'pointer', background:'none', border:'none', width:'100%', fontFamily:'var(--font-body)' },
  mobileBar: { display:'none', alignItems:'center', gap:'12px', padding:'0.75rem 1rem', background:'white', borderBottom:'1px solid var(--paper-3)', position:'sticky', top:0, zIndex:10 },
  menuBtn: { background:'none', border:'none', cursor:'pointer', color:'var(--ink-2)', padding:'4px', display:'flex' },
  mobileBrand: { fontFamily:'var(--font-serif)', fontSize:'1.1rem', fontWeight:600 },
  main: { flex:1, padding:'2.5rem 3rem', maxWidth:'860px' },
  header: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.25rem', gap:'1rem', flexWrap:'wrap' },
  pageTitle: { fontFamily:'var(--font-serif)', fontSize:'1.75rem', fontWeight:600, marginBottom:'0.2rem' },
  pageSubtitle: { color:'var(--ink-3)', fontSize:'0.8rem' },
  actions: { display:'flex', gap:'8px', alignItems:'center', flexShrink:0 },
  uploadBtn: { display:'flex', alignItems:'center', gap:'6px', padding:'0.55rem 0.9rem', borderRadius:'var(--radius)', border:'1.5px solid var(--paper-3)', background:'white', fontSize:'0.85rem', color:'var(--ink-2)', cursor:'pointer', fontFamily:'var(--font-body)' },
  newBtn: { display:'flex', alignItems:'center', gap:'6px', padding:'0.55rem 0.9rem', borderRadius:'var(--radius)', background:'var(--accent)', color:'white', border:'none', fontSize:'0.85rem', fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' },
  searchWrap: { position:'relative', marginBottom:'1.25rem', display:'flex', alignItems:'center' },
  searchIcon: { position:'absolute', left:'12px', color:'var(--ink-4)', pointerEvents:'none' },
  searchInput: { width:'100%', border:'1.5px solid var(--paper-3)', borderRadius:'var(--radius)', padding:'0.65rem 2.5rem', fontSize:'0.9rem', outline:'none', background:'white', fontFamily:'var(--font-body)', color:'var(--ink)' },
  clearBtn: { position:'absolute', right:'10px', background:'none', border:'none', cursor:'pointer', color:'var(--ink-4)', display:'flex', padding:'4px' },
  grid: { display:'flex', flexDirection:'column', gap:'8px' },
  card: { display:'flex', alignItems:'center', gap:'12px', background:'white', border:'1px solid var(--paper-3)', borderRadius:'var(--radius)', padding:'0.9rem 1.1rem', cursor:'pointer', transition:'box-shadow var(--transition)', boxShadow:'var(--shadow-sm)' },
  cardIcon: { width:'34px', height:'34px', flexShrink:0, background:'var(--paper-2)', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', color:'var(--ink-3)' },
  cardBody: { flex:1, minWidth:0 },
  docTitle: { fontSize:'0.9rem', fontWeight:600, marginBottom:'0.2rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  docMeta: { display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' },
  permBadge: { fontSize:'0.72rem', fontWeight:600 },
  docOwner: { fontSize:'0.72rem', color:'var(--ink-3)' },
  docDate: { fontSize:'0.72rem', color:'var(--ink-4)' },
  cardActions: { display:'flex', gap:'4px', flexShrink:0 },
  iconBtn: { padding:'5px', borderRadius:'4px', background:'none', border:'none', cursor:'pointer', color:'var(--ink-3)', display:'flex', alignItems:'center' },
  renameRow: { display:'flex', alignItems:'center', gap:'4px', marginBottom:'0.2rem' },
  renameInput: { border:'1.5px solid var(--accent)', borderRadius:'4px', padding:'2px 6px', fontSize:'0.875rem', outline:'none', fontFamily:'var(--font-body)', flex:1 },
  emptyState: { display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem', padding:'5rem 0', color:'var(--ink-3)' },
  emptyTitle: { fontSize:'0.95rem', fontWeight:500 },
  clearSearchBtn: { padding:'0.5rem 1rem', borderRadius:'var(--radius)', border:'1.5px solid var(--paper-3)', background:'white', fontSize:'0.85rem', cursor:'pointer', color:'var(--ink-2)', fontFamily:'var(--font-body)' },
};
