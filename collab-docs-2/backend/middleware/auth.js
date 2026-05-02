const db = require('../db/schema');

/**
 * Reads X-Username header, looks up (or returns) the user.
 * Attaches req.user = { id, username } on success.
 */
function requireAuth(req, res, next) {
  const username = (req.headers['x-username'] || '').trim();
  if (!username) {
    return res.status(401).json({ error: 'X-Username header required' });
  }

  const user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Unknown user. Please log in first.' });
  }

  req.user = user;
  next();
}

module.exports = { requireAuth };
