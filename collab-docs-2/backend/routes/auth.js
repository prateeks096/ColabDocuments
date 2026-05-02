const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/schema');

// POST /api/auth/login  — create user if not exists, return user record
router.post('/login', (req, res) => {
  const { username } = req.body;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'username is required' });
  }

  const clean = username.trim();
  if (clean.length < 2 || clean.length > 32) {
    return res.status(400).json({ error: 'Username must be 2–32 characters' });
  }
  if (!/^[a-zA-Z0-9_\-. ]+$/.test(clean)) {
    return res.status(400).json({ error: 'Username contains invalid characters' });
  }

  // Upsert: find or create
  let user = db.prepare('SELECT id, username, created_at FROM users WHERE username = ? COLLATE NOCASE').get(clean);

  if (!user) {
    const id = uuidv4();
    db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run(id, clean);
    user = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(id);
  }

  res.json({ user });
});

// GET /api/auth/me — verify session (username from header)
router.get('/me', (req, res) => {
  const username = (req.headers['x-username'] || '').trim();
  if (!username) return res.status(401).json({ error: 'Not authenticated' });

  const user = db.prepare('SELECT id, username, created_at FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (!user) return res.status(401).json({ error: 'User not found' });

  res.json({ user });
});

// GET /api/auth/users/search?q=  — search users for sharing
router.get('/users/search', (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json({ users: [] });

  const pattern = `%${q.trim()}%`;
  const users = db.prepare(
    "SELECT id, username FROM users WHERE username LIKE ? COLLATE NOCASE LIMIT 10"
  ).all(pattern);

  res.json({ users });
});

module.exports = router;
