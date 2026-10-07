const pool = require('../db');
const allowed = ['username', 'full_name', 'phone', 'avatar_url', 'city', 'address', 'notif_swaps', 'notif_orders', 'cnic_submitted'];

function adaptProfile(profile) {
  return { ...profile, completed_swaps: Number(profile.completed_swaps ?? profile.total_swaps ?? 0), committed_swaps: Number(profile.committed_swaps || 0) };
}

async function ensureProfile(id, email, name, avatar = null) {
  const base = String(name || email?.split('@')[0] || 'user')
    .toLowerCase().replace(/[^a-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30)
    || `user_${id.slice(0, 8)}`;
  let username = base;
  let suffix = 0;
  while (true) {
    const { rows } = await pool.query(
      'SELECT id FROM profiles WHERE username=$1 AND id<>$2', [username, id]
    );
    if (!rows.length) break;
    username = `${base}_${++suffix}`;
  }
  const { rows } = await pool.query(
    `INSERT INTO profiles(id,email,username,full_name,avatar_url,city)
     VALUES($1,$2,$3,$4,$5,'Pakistan')
     ON CONFLICT(id) DO UPDATE SET
       email=COALESCE(EXCLUDED.email,profiles.email),
       full_name=COALESCE(NULLIF(profiles.full_name,''),EXCLUDED.full_name),
       avatar_url=COALESCE(profiles.avatar_url,EXCLUDED.avatar_url)
     RETURNING *`,
    [id, email || null, username, name || base, avatar]
  );
  return adaptProfile(rows[0]);
}
exports.ensureProfile = ensureProfile;

exports.getProfile = async (req, res) => {
  try {
    const requestedId = req.params.userId;
    let { rows: requested } = await pool.query('SELECT id,email FROM profiles WHERE id=$1', [requestedId]);
    if (!requested.length && req.authUser?.id === requestedId) {
      await ensureProfile(
        requestedId, req.authUser.email,
        req.authUser.user_metadata?.full_name || req.authUser.user_metadata?.name,
        req.authUser.user_metadata?.avatar_url || req.authUser.user_metadata?.picture
      );
      ({ rows: requested } = await pool.query('SELECT id,email FROM profiles WHERE id=$1', [requestedId]));
    }
    if (!requested.length) return res.status(404).json({ error: 'Profile not found' });

    const email = requested[0].email;
    const query = email
      ? `SELECT id,username,full_name,avatar_url,city,swap_score,reliability_score,total_swaps,committed_swaps,completed_swaps,total_listings,is_verified,created_at
         FROM profiles WHERE lower(email)=lower($1) ORDER BY created_at DESC NULLS LAST LIMIT 1`
      : `SELECT id,username,full_name,avatar_url,city,swap_score,reliability_score,total_swaps,committed_swaps,completed_swaps,total_listings,is_verified,created_at
         FROM profiles WHERE id=$1`;
    const { rows } = await pool.query(query, [email || requestedId]);
    if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.set('Cache-Control', 'no-store');
    res.json({ data: adaptProfile(rows[0]) });
  } catch (error) {
    console.error('[pg get profile]', error.message);
    res.status(500).json({ error: 'Could not load profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (req.params.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    const keys = allowed.filter((key) => req.body[key] !== undefined);
    if (!keys.length) return res.status(400).json({ error: 'Nothing to update' });
    const values = [req.userId, ...keys.map((key) => req.body[key])];
    const set = keys.map((key, index) => `${key}=$${index + 2}`).join(',');
    const { rows } = await pool.query(
      `UPDATE profiles SET ${set} WHERE id=$1
       RETURNING id,username,full_name,avatar_url,city,swap_score,reliability_score,total_swaps,committed_swaps,completed_swaps,total_listings,is_verified,created_at`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json({ data: adaptProfile(rows[0]) });
  } catch (error) {
    console.error('[pg profile update]', error.message);
    res.status(500).json({ error: 'Could not update profile' });
  }
};

exports.createGoogleProfile = async (req, res) => {
  try {
    const { email, name, avatar_url } = req.body || {};
    const user = req.authUser;
    const profile = await ensureProfile(
      user.id, user.email || email, name || user.user_metadata?.full_name,
      avatar_url || user.user_metadata?.avatar_url
    );
    res.json({ data: profile });
  } catch (error) {
    console.error('[pg google profile]', error.message);
    res.status(500).json({ error: 'Could not create profile' });
  }
};

exports.refreshProfile = async (req, res) => {
  try {
    const user = req.authUser;
    const profile = await ensureProfile(
      user.id, user.email,
      user.user_metadata?.full_name || user.user_metadata?.name,
      user.user_metadata?.avatar_url || user.user_metadata?.picture
    );
    res.json({ data: profile });
  } catch (error) {
    console.error('[pg refresh profile]', error.message);
    res.status(500).json({ error: 'Could not refresh profile' });
  }
};
