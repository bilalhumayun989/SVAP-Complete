const pool = require('../db');
const { supabase } = require('../config/supabase');
const profiles = require('./pgProfileController');

exports.checkUsernameAvailability = async (req, res) => {
  const username = String(req.query.username || '').trim();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 letters, numbers or underscores' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM profiles WHERE lower(username)=lower($1)) AS taken',
      [username],
    );
    res.set('Cache-Control', 'no-store');
    res.json({ available: !rows[0].taken });
  } catch (error) {
    console.error('[pg username availability]', error.message);
    res.status(500).json({ error: 'Could not check username availability' });
  }
};
exports.signup = async (req, res) => {
  try {
    const { email: rawEmail, username, phone } = req.body || {};
    const email = String(rawEmail || '').trim().toLowerCase();
    if (!email || !username) return res.status(400).json({ error: 'Username and email are required' });
    const user = req.authUser;
    if (!user?.id || user.email?.toLowerCase() !== email) {
      return res.status(403).json({ error: 'Verify this email before completing signup' });
    }
    if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username must be 3-20 letters, numbers or underscores' });
    }
    if (phone && !/^03\d{9}$/.test(String(phone).replace(/\D/g, ''))) {
      return res.status(400).json({ error: 'Invalid Pakistani phone number' });
    }
    const { rows: used } = await pool.query(
      'SELECT id FROM profiles WHERE lower(username)=lower($1) AND id<>$2', [username, user.id],
    );
    if (used.length) return res.status(409).json({ error: 'Username is already taken' });
    await profiles.ensureProfile(user.id, email, username, user.user_metadata?.avatar_url || user.user_metadata?.picture);
    const { rows } = await pool.query(
      'UPDATE profiles SET username=$1,full_name=$1,phone=$2 WHERE id=$3 RETURNING *',
      [username, phone || null, user.id],
    );
    res.json({ data: { user: { id: user.id, email: user.email }, profile: { ...rows[0], completed_swaps: Number(rows[0].completed_swaps ?? rows[0].total_swaps ?? 0), committed_swaps: Number(rows[0].committed_swaps || 0) } }, message: 'Profile saved. Sign in to continue.' });
  } catch (error) {
    console.error('[pg signup]', error.message);
    res.status(500).json({ error: 'Could not save profile' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    const profile = await profiles.ensureProfile(
      data.user.id, data.user.email,
      data.user.user_metadata?.full_name || data.user.user_metadata?.username,
      data.user.user_metadata?.avatar_url,
    );
    res.json({ data, profile });
  } catch (error) {
    console.error('[pg login]', error.message);
    res.status(500).json({ error: 'Could not sign in' });
  }
};
