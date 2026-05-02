import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

import { getDoc, updateDoc } from '../../utils/api';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useToast } from '../shared/Toast';
import { EditorSkeleton } from '../shared/Skeletons';
import EditorToolbar from './EditorToolbar';
import ShareModal from '../shared/ShareModal';
import { ArrowLeft, Share2, Cloud, CloudOff, Loader2, Eye, FileText } from 'lucide-react';

const SAVE_LABELS = {
  saved:   { label: 'Saved',      icon: Cloud,     color: 'var(--success)' },
  saving:  { label: 'Saving…',    icon: Loader2,   color: 'var(--ink-3)'  },
  unsaved: { label: 'Unsaved',    icon: CloudOff,  color: 'var(--warn)'   },
  error:   { label: 'Save error', icon: CloudOff,  color: 'var(--danger)' },
};

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [error, setError] = useState('');

  const isPlainMode = doc?.contentType === 'markdown' || doc?.contentType === 'plaintext';
  const canEdit = doc?.permission === 'owner' || doc?.permission === 'edit';

  useEffect(() => {
    getDoc(id)
      .then(r => {
        const d = r.data.doc;
        setDoc(d);
        setTitle(d.title);
        setContent(d.content);
      })
      .catch(e => setError(e.response?.data?.error || 'Could not load document'))
      .finally(() => setLoading(false));
  }, [id]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      Highlight,
      Typography,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      CharacterCount,
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: '',
    editable: canEdit,
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
  });

  useEffect(() => {
    if (!editor || !doc) return;
    if (isPlainMode) {
      setContent(doc.content);
    } else {
      editor.commands.setContent(doc.content || '');
      editor.setEditable(canEdit);
    }
  }, [editor, doc]);

  const saveStatus = useAutoSave(id, content, title, doc?.permission);
  const saveInfo = SAVE_LABELS[saveStatus] || SAVE_LABELS.saved;
  const SaveIcon = saveInfo.icon;

  // Show toast on save error
  useEffect(() => {
    if (saveStatus === 'error') toast.error('Auto-save failed. Check your connection.');
  }, [saveStatus]);

  // Force save
  const forceSave = useCallback(async () => {
    if (!canEdit) return;
    try {
      await updateDoc(id, { content, title });
      toast.success('Saved');
    } catch {
      toast.error('Save failed');
    }
  }, [id, content, title, canEdit]);

  useKeyboardShortcuts([
    { key: 's', ctrl: true, action: forceSave },
    { key: 'k', ctrl: true, shift: true, action: () => doc?.permission === 'owner' && setShowShare(true) },
  ]);

  if (loading) return (
    <div style={s.page}>
      <div style={s.topbar}>
        <button style={s.backBtn} onClick={() => navigate('/')}><ArrowLeft size={16} /> Docs</button>
        <div style={{ flex: 1 }} />
      </div>
      <EditorSkeleton />
    </div>
  );

  if (error) return (
    <div style={s.center}>
      <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>
      <button style={s.backBtn} onClick={() => navigate('/')}>← Dashboard</button>
    </div>
  );

  return (
    <div style={s.page}>
      <header style={s.topbar}>
        <button style={s.backBtn} onClick={() => navigate('/')}><ArrowLeft size={16} /> Docs</button>

        <div style={s.titleWrap}>
          <input
            style={s.titleInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={!canEdit}
            placeholder="Untitled Document"
            maxLength={200}
          />
          {!canEdit && (
            <span style={s.viewOnlyBadge}><Eye size={12} /> View only</span>
          )}
        </div>

        <div style={s.topActions}>
          <span style={{ ...s.saveStatus, color: saveInfo.color }}>
            <SaveIcon size={13} style={saveStatus === 'saving' ? { animation: 'spin 1s linear infinite' } : {}} />
            {saveInfo.label}
          </span>
          {doc?.permission === 'owner' && (
            <button style={s.shareBtn} onClick={() => setShowShare(true)} title="Share (⌘⇧K)">
              <Share2 size={15} /> Share
            </button>
          )}
        </div>
      </header>

      {!isPlainMode && <EditorToolbar editor={editor} disabled={!canEdit} />}

      <div style={s.editorWrap}>
        <div style={s.sheet}>
          {isPlainMode ? (
            <textarea
              style={s.plainEditor}
              value={content}
              onChange={e => setContent(e.target.value)}
              disabled={!canEdit}
              placeholder="Start writing…"
              spellCheck
            />
          ) : (
            <EditorContent editor={editor} className="tiptap-editor" />
          )}
        </div>
      </div>

      <footer style={s.footer}>
        <span style={s.footerMeta}>
          <FileText size={12} />
          {isPlainMode
            ? `${content.length} characters`
            : editor
              ? `${editor.storage.characterCount?.words() ?? 0} words · ${editor.storage.characterCount?.characters() ?? 0} chars`
              : ''}
        </span>
        <span style={s.footerMeta}>
          {doc?.contentType === 'markdown' ? 'Markdown' : doc?.contentType === 'plaintext' ? 'Plain text' : 'Rich text'}
          {canEdit && <span style={{ color: 'var(--ink-4)', marginLeft: '8px' }}>⌘S to save</span>}
        </span>
      </footer>

      {showShare && <ShareModal docId={id} docTitle={title} onClose={() => setShowShare(false)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const s = {
  page: { display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--paper)' },
  topbar: { display:'flex', alignItems:'center', gap:'16px', padding:'0 1.5rem', height:'56px', background:'white', borderBottom:'1px solid var(--paper-3)', position:'sticky', top:0, zIndex:10 },
  backBtn: { display:'flex', alignItems:'center', gap:'6px', padding:'6px 10px', borderRadius:'var(--radius)', border:'none', background:'none', cursor:'pointer', color:'var(--ink-3)', fontSize:'0.875rem', flexShrink:0, fontFamily:'var(--font-body)' },
  titleWrap: { flex:1, display:'flex', alignItems:'center', gap:'10px', minWidth:0 },
  titleInput: { border:'none', outline:'none', background:'transparent', fontSize:'1rem', fontWeight:600, color:'var(--ink)', fontFamily:'var(--font-body)', width:'100%', padding:'4px 8px', borderRadius:'4px' },
  viewOnlyBadge: { display:'flex', alignItems:'center', gap:'4px', fontSize:'0.75rem', color:'var(--ink-3)', background:'var(--paper-2)', borderRadius:'999px', padding:'3px 8px', flexShrink:0, whiteSpace:'nowrap' },
  topActions: { display:'flex', alignItems:'center', gap:'12px', flexShrink:0 },
  saveStatus: { display:'flex', alignItems:'center', gap:'5px', fontSize:'0.8rem', fontWeight:500 },
  shareBtn: { display:'flex', alignItems:'center', gap:'6px', padding:'6px 14px', borderRadius:'var(--radius)', background:'var(--accent)', color:'white', border:'none', fontSize:'0.875rem', fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' },
  editorWrap: { flex:1, padding:'2.5rem 1.5rem', display:'flex', justifyContent:'center' },
  sheet: { width:'100%', maxWidth:'720px', background:'white', borderRadius:'var(--radius)', boxShadow:'var(--shadow-sm)', border:'1px solid var(--paper-3)', padding:'3rem 4rem', minHeight:'60vh' },
  plainEditor: { width:'100%', minHeight:'60vh', border:'none', outline:'none', resize:'none', fontFamily:'var(--font-mono)', fontSize:'0.95rem', lineHeight:1.7, color:'var(--ink)', background:'transparent' },
  footer: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.6rem 2rem', background:'white', borderTop:'1px solid var(--paper-2)' },
  footerMeta: { display:'flex', alignItems:'center', gap:'5px', fontSize:'0.75rem', color:'var(--ink-4)' },
  center: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', color:'var(--ink-3)', minHeight:'100vh' },
};
