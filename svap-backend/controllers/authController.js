const { supabase, supabaseAdmin } = require('../config/supabase');
const { sendOtpEmail } = require('../config/mailer');

// Use admin client for auth operations (bypasses RLS), fall back to anon client if no service key
const authClient = supabaseAdmin || supabase;

// ── Generate a 6-digit OTP ──────────────────────────────────────────────────
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// ── POST /api/auth/send-otp ─────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // Use admin client to bypass RLS
    const client = supabaseAdmin || supabase;
    const { error: dbError } = await client
      .from('otp_verifications')
      .upsert({ email, otp, expires_at: expiresAt, verified: false }, { onConflict: 'email' });

    if (dbError) {
      console.error('[sendOtp] DB error:', dbError.message);
      return res.status(500).json({ error: 'Failed to save OTP' });
    }

    await sendOtpEmail(email, otp);
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('[sendOtp] Error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// ── POST /api/auth/verify-otp ───────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const client = supabaseAdmin || supabase;

    const { data: record, error: fetchError } = await client
      .from('otp_verifications')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError || !record) {
      return res.status(400).json({ error: 'OTP not found. Please request a new one.' });
    }

    if (record.verified) {
      return res.status(400).json({ error: 'OTP already used.' });
    }

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    // Mark as verified
    await client
      .from('otp_verifications')
      .update({ verified: true })
      .eq('email', email);

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('[verifyOtp] Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.signup = async (req, res) => {
  try {
    const { email, password, username, phone } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Username, Email, and password are required' });
    }

    // Pre-check if username is already taken to avoid constraint errors
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();
      
    if (existingProfile) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    console.log('[signup] Using authClient:', authClient === supabaseAdmin ? 'admin' : 'anon');
    const { data, error } = await authClient.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: 'http://localhost:5173',
        data: {
          username: username,
          full_name: username
        }
      }
    });
    
    if (error) {
      console.error('[signup] Supabase error:', JSON.stringify(error));
      const msg = error.message || error.error_description || JSON.stringify(error);
      return res.status(400).json({ error: msg });
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        username: username,
        full_name: '',
        email,
        phone: phone || '',
      }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile upsert error:', profileError.message);
      }
    }

    res.json({ data, message: 'Signup successful. Please verify your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await authClient.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    let profile = null;
    if (data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      profile = profileData;
    }

    res.json({ data, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
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

exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
