const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const db = require('../db/schema');
const { requireAuth } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['text/plain', 'text/markdown'];
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (allowed.includes(file.mimetype) || ext === 'md' || ext === 'txt') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt and .md files are allowed'));
    }
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDocWithPermission(docId, userId) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  if (!doc) return { doc: null, permission: null };

  if (doc.owner_id === userId) return { doc, permission: 'owner' };

  const share = db.prepare(
    'SELECT permission FROM shares WHERE doc_id = ? AND shared_with = ?'
  ).get(docId, userId);

  return { doc, permission: share?.permission || null };
}

function formatDoc(doc, permission, ownerUsername) {
  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    contentType: doc.content_type,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    permission,
    owner: ownerUsername
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/docs — My Documents
router.get('/', requireAuth, (req, res) => {
  const docs = db.prepare(`
    SELECT d.*, u.username as owner_username
    FROM documents d
    JOIN users u ON u.id = d.owner_id
    WHERE d.owner_id = ?
    ORDER BY d.updated_at DESC
  `).all(req.user.id);

  res.json({ docs: docs.map(d => formatDoc(d, 'owner', d.owner_username)) });
});

// GET /api/docs/shared — Shared with Me
router.get('/shared', requireAuth, (req, res) => {
  const docs = db.prepare(`
    SELECT d.*, s.permission, u.username as owner_username
    FROM shares s
    JOIN documents d ON d.id = s.doc_id
    JOIN users u ON u.id = d.owner_id
    WHERE s.shared_with = ?
    ORDER BY d.updated_at DESC
  `).all(req.user.id);

  res.json({ docs: docs.map(d => formatDoc(d, d.permission, d.owner_username)) });
});

// POST /api/docs — Create new document
router.post('/', requireAuth, (req, res) => {
  const { title = 'Untitled Document', content = '', contentType = 'richtext' } = req.body;
  const id = uuidv4();

  db.prepare(
    'INSERT INTO documents (id, owner_id, title, content, content_type) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.user.id, title, content, contentType);

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  res.status(201).json({ doc: formatDoc(doc, 'owner', req.user.username) });
});

// POST /api/docs/upload — Upload .txt or .md file
router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  const contentType = ext === 'md' ? 'markdown' : 'plaintext';
  const rawTitle = req.file.originalname.replace(/\.(txt|md)$/i, '') || 'Uploaded Document';
  const content = req.file.buffer.toString('utf-8');
  const id = uuidv4();

  db.prepare(
    'INSERT INTO documents (id, owner_id, title, content, content_type) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.user.id, rawTitle, content, contentType);

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  res.status(201).json({ doc: formatDoc(doc, 'owner', req.user.username) });
});

// GET /api/docs/:id — Get single document
router.get('/:id', requireAuth, (req, res) => {
  const { doc, permission } = getDocWithPermission(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (!permission) return res.status(403).json({ error: 'Access denied' });

  const owner = db.prepare('SELECT username FROM users WHERE id = ?').get(doc.owner_id);
  res.json({ doc: formatDoc(doc, permission, owner?.username) });
});

// PATCH /api/docs/:id — Update title and/or content (auto-save)
router.patch('/:id', requireAuth, (req, res) => {
  const { doc, permission } = getDocWithPermission(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (!permission || permission === 'view') return res.status(403).json({ error: 'Edit access required' });

  const { title, content } = req.body;
  const updates = [];
  const params = [];

  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (content !== undefined) { updates.push('content = ?'); params.push(content); }
  if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

  updates.push('updated_at = unixepoch()');
  params.push(req.params.id);

  db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  const owner = db.prepare('SELECT username FROM users WHERE id = ?').get(updated.owner_id);
  res.json({ doc: formatDoc(updated, permission, owner?.username) });
});

// DELETE /api/docs/:id — Delete document (owner only)
router.delete('/:id', requireAuth, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Owner access required' });

  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─── Sharing sub-routes ───────────────────────────────────────────────────────

// GET /api/docs/:id/shares — List shares for a document
router.get('/:id/shares', requireAuth, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Owner access required' });

  const shares = db.prepare(`
    SELECT s.id, s.permission, s.created_at, u.id as user_id, u.username
    FROM shares s
    JOIN users u ON u.id = s.shared_with
    WHERE s.doc_id = ?
    ORDER BY s.created_at DESC
  `).all(req.params.id);

  res.json({ shares });
});

// POST /api/docs/:id/shares — Share with a user
router.post('/:id/shares', requireAuth, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Owner access required' });

  const { username, permission } = req.body;
  if (!username || !['view', 'edit'].includes(permission)) {
    return res.status(400).json({ error: 'username and permission (view|edit) required' });
  }

  const targetUser = db.prepare('SELECT id, username FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (!targetUser) return res.status(404).json({ error: `User "${username}" not found` });
  if (targetUser.id === req.user.id) return res.status(400).json({ error: 'Cannot share with yourself' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO shares (id, doc_id, shared_by, shared_with, permission)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(doc_id, shared_with) DO UPDATE SET permission = excluded.permission
  `).run(id, req.params.id, req.user.id, targetUser.id, permission);

  res.status(201).json({ success: true, sharedWith: targetUser.username, permission });
});

// PATCH /api/docs/:id/shares/:shareId — Update permission
router.patch('/:id/shares/:shareId', requireAuth, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Owner access required' });

  const { permission } = req.body;
  if (!['view', 'edit'].includes(permission)) {
    return res.status(400).json({ error: 'permission must be view or edit' });
  }

  const result = db.prepare(
    'UPDATE shares SET permission = ? WHERE id = ? AND doc_id = ?'
  ).run(permission, req.params.shareId, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Share not found' });
  res.json({ success: true });
});

// DELETE /api/docs/:id/shares/:shareId — Revoke share
router.delete('/:id/shares/:shareId', requireAuth, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Owner access required' });

  db.prepare('DELETE FROM shares WHERE id = ? AND doc_id = ?').run(req.params.shareId, req.params.id);
  res.json({ success: true });
});

module.exports = router;
