const pool = require('../db');
const { supabase, supabaseAdmin } = require('../config/supabase');
const profiles = require('./pgProfileController');

async function findAuthUser(email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data?.users?.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (!data?.users?.length || data.users.length < 1000) return null;
  }
}

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
    if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username must be 3-20 letters, numbers or underscores' });
    }
    if (phone && !/^03\d{9}$/.test(String(phone).replace(/\D/g, ''))) {
      return res.status(400).json({ error: 'Invalid Pakistani phone number' });
    }
    const { rows: otpRows } = await pool.query(
      'SELECT 1 FROM otp_verifications WHERE email=$1 AND verified=true AND expires_at>now()',
      [email],
    );
    if (!otpRows.length) return res.status(401).json({ error: 'Please verify your email first' });
    const user = await findAuthUser(email);
    if (!user) return res.status(401).json({ error: 'Please verify your email first' });
    const { rows: used } = await pool.query(
      'SELECT id FROM profiles WHERE lower(username)=lower($1) AND id<>$2', [username, user.id],
    );
    if (used.length) return res.status(409).json({ error: 'Username is already taken' });
    await profiles.ensureProfile(user.id, email, username, user.user_metadata?.avatar_url || user.user_metadata?.picture);
    const { rows } = await pool.query(
      'UPDATE profiles SET username=$1,full_name=$1,phone=$2 WHERE id=$3 RETURNING *',
      [username, phone || null, user.id],
    );
    await pool.query('DELETE FROM otp_verifications WHERE email=$1', [email]);
    res.json({ data: { user: { id: user.id, email: user.email }, profile: rows[0] }, message: 'Profile saved. Sign in to continue.' });
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
