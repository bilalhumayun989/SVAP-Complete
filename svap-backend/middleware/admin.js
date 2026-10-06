// PostgreSQL production profiles do not carry an admin flag, and this project has no trusted admin identity source yet.
// Keep these routes authenticated and fail closed until an explicit admin policy is configured.
function requireAdmin(_req, res) {
  return res.status(503).json({ error: 'Admin authorization is not configured for this backend' });
}
module.exports = { requireAdmin };
