const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize DB (runs schema creation on first boot)
require('./db/schema');

const authRoutes = require('./routes/auth');
const docsRoutes = require('./routes/docs');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Username'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/docs', docsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));


// Serve the production frontend from the backend in deployed environments.
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), err => {
    if (err) next();
  });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large (max 5MB)' });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 collab-docs backend running on http://localhost:${PORT}`);
  console.log(`   SQLite DB: ./data/collab-docs.db\n`);
});
