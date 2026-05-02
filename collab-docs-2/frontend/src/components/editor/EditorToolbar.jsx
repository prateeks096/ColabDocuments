import {
  Bold, Italic, Underline, Strikethrough, Code, Link,
  List, ListOrdered, Quote, Minus, Highlighter,
  Heading1, Heading2, Heading3, Undo, Redo,
  CheckSquare
} from 'lucide-react';

export default function EditorToolbar({ editor, disabled }) {
  if (!editor) return null;

  const btn = (title, action, isActive) => (
    <button
      key={title}
      title={title}
      onMouseDown={e => { e.preventDefault(); action(); }}
      disabled={disabled}
      style={{
        ...s.btn,
        ...(isActive ? s.btnActive : {}),
        ...(disabled ? s.btnDisabled : {})
      }}
    >
      {title}
    </button>
  );

  const iconBtn = (Icon, title, action, isActive) => (
    <button
      key={title}
      title={title}
      onMouseDown={e => { e.preventDefault(); action(); }}
      disabled={disabled}
      style={{
        ...s.btn,
        ...(isActive ? s.btnActive : {}),
        ...(disabled ? s.btnDisabled : {})
      }}
    >
      <Icon size={15} />
    </button>
  );

  const addLink = () => {
    const url = prompt('Enter URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div style={s.toolbar}>
      <div style={s.group}>
        {iconBtn(Undo, 'Undo', () => editor.chain().focus().undo().run())}
        {iconBtn(Redo, 'Redo', () => editor.chain().focus().redo().run())}
      </div>
      <div style={s.sep} />
      <div style={s.group}>
        {iconBtn(Heading1, 'Heading 1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
        {iconBtn(Heading2, 'Heading 2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
        {iconBtn(Heading3, 'Heading 3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
      </div>
      <div style={s.sep} />
      <div style={s.group}>
        {iconBtn(Bold, 'Bold', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
        {iconBtn(Italic, 'Italic', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
        {iconBtn(Underline, 'Underline', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
        {iconBtn(Strikethrough, 'Strike', () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
        {iconBtn(Highlighter, 'Highlight', () => editor.chain().focus().toggleHighlight().run(), editor.isActive('highlight'))}
      </div>
      <div style={s.sep} />
      <div style={s.group}>
        {iconBtn(Code, 'Code', () => editor.chain().focus().toggleCode().run(), editor.isActive('code'))}
        {iconBtn(Link, 'Link', addLink, editor.isActive('link'))}
      </div>
      <div style={s.sep} />
      <div style={s.group}>
        {iconBtn(List, 'Bullet list', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {iconBtn(ListOrdered, 'Ordered list', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
        {iconBtn(CheckSquare, 'Task list', () => editor.chain().focus().toggleTaskList().run(), editor.isActive('taskList'))}
        {iconBtn(Quote, 'Blockquote', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
        {iconBtn(Minus, 'Divider', () => editor.chain().focus().setHorizontalRule().run())}
      </div>
    </div>
  );
}

const s = {
  toolbar: {
    display: 'flex', alignItems: 'center', flexWrap: 'wrap',
    gap: '2px', padding: '0.5rem 1rem',
    borderBottom: '1px solid var(--paper-3)',
    background: 'white',
    position: 'sticky', top: '56px', zIndex: 5,
  },
  group: { display: 'flex', alignItems: 'center', gap: '2px' },
  sep: { width: '1px', height: '20px', background: 'var(--paper-3)', margin: '0 4px' },
  btn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '5px 7px', borderRadius: '5px',
    border: 'none', background: 'none', cursor: 'pointer',
    color: 'var(--ink-2)', transition: 'background var(--transition)',
  },
  btnActive: { background: 'var(--accent-bg)', color: 'var(--accent)' },
  btnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
};
