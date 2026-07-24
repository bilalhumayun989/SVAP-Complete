const { supabase, supabaseAdmin } = require('../config/supabase');
const { sendOtpEmail } = require('../config/mailer');

// authClient = admin if available (bypasses RLS), else anon
const authClient = supabaseAdmin || supabase;

// ── POST /api/auth/send-otp ─────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: dbError } = await authClient
      .from('otp_verifications')
      .upsert({ email, otp, expires_at, verified: false });

    if (dbError) throw dbError;

    await sendOtpEmail(email, otp);
    res.json({ message: 'OTP sent successfully to email' });
  } catch (err) {
    console.error('[sendOtp] Error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP: ' + err.message });
  }
};

// ── POST /api/auth/verify-otp ───────────────────────────────────────────────
// Flow: verify OTP in DB → find/create Supabase user → set known password → sign in → return session
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });
    if (!supabaseAdmin) return res.status(500).json({ error: 'Server misconfigured: missing service role key' });

    // 1. Verify OTP in DB
    const { data: record, error: dbError } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .single();

    if (dbError || !record) return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    if (new Date(record.expires_at) < new Date()) return res.status(400).json({ error: 'OTP has expired. Request a new one.' });

    await supabaseAdmin.from('otp_verifications').update({ verified: true }).eq('email', email);

    // 2. Find or create user via listUsers (paginated)
    let existingUser = null;
    let page = 1;
    while (!existingUser) {
      const { data: pg } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (!pg?.users?.length) break;
      existingUser = pg.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
      if (existingUser || pg.users.length < 1000) break;
      page++;
    }

    // 3. Set a known temp password — we'll use this to sign in and return a real session
    //    This password is immediately used below and not exposed to the user
    const tempPassword = `OTP_${otp}_${Date.now()}`;
    let userId;

    if (existingUser) {
      userId = existingUser.id;
      // Reset password so we can sign in right after
      const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: tempPassword,
        email_confirm: true,
      });
      if (pwErr) {
        console.error('[verifyOtp] updateUserById error:', pwErr.message);
        return res.status(400).json({ error: 'Failed to update user: ' + pwErr.message });
      }
    } else {
      // New user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });
      if (createError) {
        console.error('[verifyOtp] createUser error:', createError.message);
        return res.status(400).json({ error: 'Failed to create user: ' + createError.message });
      }
      userId = newUser.user.id;

      // Create profile row
      await supabaseAdmin.from('profiles').upsert(
        { id: userId, email, username: email.split('@')[0], full_name: '' },
        { onConflict: 'id' }
      );
    }

    // 4. Sign in with the temp password to get a real session using the ANON client
    // (Crucial: do not use supabaseAdmin here, otherwise the token will be rejected by the frontend)
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: tempPassword,
    });

    if (signInError) {
      console.error('[verifyOtp] signIn error:', signInError.message);
      // Return user info without session — frontend can still proceed
      return res.json({ message: 'OTP verified', session: null, user: { id: userId, email } });
    }

    return res.json({
      message: 'OTP verified successfully',
      session: sessionData.session,
      user: sessionData.user,
    });

  } catch (err) {
    console.error('[verifyOtp] Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ── POST /api/auth/signup ───────────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { email, password, username, phone } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Username, Email, and password are required' });
    }

    // Check username taken
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (existingProfile) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    // Check if user already exists in auth (from OTP flow)
    let existingAuthUser = null;
    let page = 1;
    while (!existingAuthUser) {
      const { data: pg } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (!pg?.users?.length) break;
      existingAuthUser = pg.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
      if (existingAuthUser || pg.users.length < 1000) break;
      page++;
    }

    let userId;

    if (existingAuthUser) {
      // User already exists from OTP verification — just update password & profile
      userId = existingAuthUser.id;
      await supabaseAdmin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    } else {
      // Brand new user
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, full_name: username },
      });
      if (error) {
        console.error('[signup] createUser error:', error.message);
        return res.status(400).json({ error: error.message });
      }
      userId = data.user.id;
    }

    // Upsert profile (admin client — bypasses RLS)
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      { id: userId, username, full_name: username, email, phone: phone || '' },
      { onConflict: 'id' }
    );
    if (profileError) console.error('[signup] Profile upsert error:', profileError.message);

    res.json({ data: { user: { id: userId, email } }, message: 'Signup successful.' });
  } catch (err) {
    console.error('[signup] Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ── POST /api/auth/login ────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    // Use anon client (supabase) for login to avoid admin session caching issues
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[login] Supabase error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    let profile = null;
    if (data?.user) {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (profileError) console.warn('[login] Profile fetch error:', profileError.message);
      profile = profileData;
    }

    res.json({ data, profile });
  } catch (err) {
    console.error('[login] Unexpected error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ── GET /api/auth/profile/:userId ───────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return res.status(404).json({ error: 'Profile not found' });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ── PUT /api/auth/profile/:userId ───────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[updateProfile] error:', error.message);
      return res.status(400).json({ error: error.message });
    }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
