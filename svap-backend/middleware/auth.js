const { supabaseAdmin } = require('../config/supabase');

async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  if (!header.startsWith('Bearer ') || !supabaseAdmin) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(header.slice(7));
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid or expired session' });
    req.userId = data.user.id;
    req.authUser = data.user;
    next();
  } catch (_error) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

async function optionalAuth(req, _res, next) {
  const header = req.get('authorization') || '';
  if (!header.startsWith('Bearer ') || !supabaseAdmin) { req.userId = null; return next(); }
  try {
    const { data } = await supabaseAdmin.auth.getUser(header.slice(7));
    req.userId = data?.user?.id || null;
    req.authUser = data?.user || null;
  } catch (_error) { req.userId = null; }
  next();
}
module.exports = { requireAuth, optionalAuth };

