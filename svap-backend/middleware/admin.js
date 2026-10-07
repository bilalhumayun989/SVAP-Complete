const pool = require('../db');

async function requireAdmin(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT is_admin FROM profiles WHERE id=$1', [req.userId]);
    if (!rows[0]?.is_admin) return res.status(403).json({ error: 'Admin access required' });
    next();
  } catch (error) {
    console.error('[admin authorization]', error.message);
    res.status(503).json({ error: 'Admin authorization is unavailable. Ensure profiles.is_admin exists in PostgreSQL.' });
  }
}
module.exports = { requireAdmin };