const { supabase, supabaseAdmin } = require('../config/supabase');
const { sendOtpEmail } = require('../config/mailer');

// authClient = admin if available (bypasses RLS), else anon
const authClient = supabaseAdmin || supabase;

const generateUniqueUsername = async (preferredUsername, userId) => {
  const base = (preferredUsername || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '') || `user_${(userId || '').slice(0, 8) || 'svap'}`;

  let username = base;
  let attempt = 0;

  while (true) {
    const { data: existing, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    if (!existing) return username;

    attempt += 1;
    username = `${base}_${attempt}`;
  }
};

const getExistingAuthUserByEmail = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !supabaseAdmin) return null;

  let existingUser = null;
  let page = 1;

  while (true) {
    const { data: pg, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    if (!pg?.users?.length) break;

    existingUser = pg.users.find((user) => user.email?.toLowerCase() === normalizedEmail) || null;
    if (existingUser || pg.users.length < 1000) break;
    page += 1;
  }

  if (existingUser) return existingUser;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (profileError && profileError.code !== 'PGRST116') throw profileError;
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    app_metadata: { provider: 'email' },
    identities: [],
  };
};

// ── POST /api/auth/send-otp ─────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await getExistingAuthUserByEmail(normalizedEmail);

    if (existingUser) {
      const identities = existingUser.identities || [];
      const provider = existingUser.app_metadata?.provider || identities.find((identity) => identity.provider)?.provider || 'email';
      const isGoogleUser = provider === 'google' || identities.some((identity) => identity.provider === 'google');

      return res.status(409).json({
        error: isGoogleUser
          ? 'Email already registered via Google. Please try to login with Google.'
          : 'Email already registered. Please try to login with Google.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: dbError } = await authClient
      .from('otp_verifications')
      .upsert({ email: normalizedEmail, otp, expires_at, verified: false });

    if (dbError) throw dbError;

    await sendOtpEmail(normalizedEmail, otp);
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

      // Create profile row with a guaranteed-unique username
      const uniqueUsername = await generateUniqueUsername(email.split('@')[0], userId);
      await supabaseAdmin.from('profiles').upsert(
        { id: userId, email, username: uniqueUsername, full_name: '' },
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

    // Check if user already exists in auth (from OTP flow or Google OAuth)
    let existingAuthUser = null;
    let page = 1;
    while (!existingAuthUser) {
      const { data: pg } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (!pg?.users?.length) break;
      existingAuthUser = pg.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
      if (existingAuthUser || pg.users.length < 1000) break;
      page++;
    }

    if (existingAuthUser) {
      const provider = existingAuthUser.app_metadata?.provider || existingAuthUser.identities?.find((identity) => identity.provider)?.provider || 'email';
      const isGoogleUser = provider === 'google' || existingAuthUser.identities?.some((identity) => identity.provider === 'google');
      return res.status(409).json({
        error: isGoogleUser
          ? 'Yeh email Google se registered hai. Continue with Google button use karein login ke liye.'
          : 'Yeh email already registered hai. Please login karein.',
      });
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

    const uniqueUsername = await generateUniqueUsername(username, userId);

    // Upsert profile (admin client — bypasses RLS)
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      { id: userId, username: uniqueUsername, full_name: username, email, phone: phone || '' },
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

// ── POST /api/auth/create-google-profile ───────────────────────────────────
exports.createGoogleProfile = async (req, res) => {
  try {
    const { userId, email, name, avatar_url, provider } = req.body;
    if (!userId || !email) {
      return res.status(400).json({ error: 'User ID and email are required' });
    }

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[createGoogleProfile] Check existing profile error:', checkError.message);
      return res.status(400).json({ error: 'Failed to check existing profile: ' + checkError.message });
    }

    if (existingProfile) {
      // Profile exists, return it
      return res.json({ data: existingProfile });
    }

    // Generate unique username from name or email
    const baseName = (name || email.split('@')[0] || 'user').trim();
    const uniqueUsername = await generateUniqueUsername(baseName, userId);

    // Create new profile with your table structure
    const profileData = {
      id: userId,
      username: uniqueUsername,
      full_name: baseName,
      email: email,
      avatar_url: avatar_url || null,
      city: 'Pakistan',
      swap_score: 0,
      total_swaps: 0,
      total_listings: 0,
      is_verified: false,
      cnic_submitted: false,
      created_at: new Date().toISOString()
    };

    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('[createGoogleProfile] Profile creation error:', profileError.message);
      
      // If the error is about missing columns, try with basic fields only
      if (profileError.message.includes('column')) {
        const basicProfileData = {
          id: userId,
          username: uniqueUsername,
          full_name: baseName,
          email: email,
          city: 'Pakistan',
          swap_score: 0,
          total_swaps: 0,
          total_listings: 0,
          is_verified: false,
          cnic_submitted: false,
          created_at: new Date().toISOString()
        };
        
        const { data: basicProfile, error: basicError } = await supabaseAdmin
          .from('profiles')
          .insert(basicProfileData)
          .select()
          .single();
          
        if (basicError) {
          return res.status(400).json({ error: 'Failed to create profile: ' + basicError.message });
        }
        
        // Update auth user metadata
        try {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { 
              full_name: baseName,
              display_name: baseName,
              username: uniqueUsername
            }
          });
        } catch (authError) {
          console.warn('[createGoogleProfile] Auth update warning:', authError.message);
        }

        console.log(`[createGoogleProfile] Successfully created basic profile for user ${userId} with username ${uniqueUsername}`);
        return res.json({ data: basicProfile });
      }
      
      return res.status(400).json({ error: 'Failed to create profile: ' + profileError.message });
    }

    // Update auth user metadata with display name for Supabase Auth dashboard
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { 
          full_name: baseName,
          display_name: baseName,
          username: uniqueUsername
        }
      });
    } catch (authError) {
      console.warn('[createGoogleProfile] Auth update warning:', authError.message);
      // Don't fail the request if auth update fails
    }

    console.log(`[createGoogleProfile] Successfully created profile for user ${userId} with username ${uniqueUsername}`);
    res.json({ data: newProfile });
  } catch (err) {
    console.error('[createGoogleProfile] Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ── POST /api/auth/refresh-profile ─────────────────────────────────────────
exports.refreshProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get the user from auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !authUser) {
      return res.status(404).json({ error: 'User not found in auth' });
    }

    // Check if profile exists
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      return res.status(400).json({ error: 'Error checking profile: ' + profileCheckError.message });
    }

    const user = authUser.user;
    const metadata = user.user_metadata || {};
    const name = metadata.full_name || metadata.name || user.email?.split('@')[0] || "User";

    if (!existingProfile) {
      // Create new profile
      const uniqueUsername = await generateUniqueUsername(name, userId);
      
      const profileData = {
        id: userId,
        username: uniqueUsername,
        full_name: name,
        email: user.email,
        avatar_url: metadata.avatar_url || metadata.picture || null,
        city: 'Pakistan',
        created_at: new Date().toISOString()
      };

      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (createError) {
        return res.status(400).json({ error: 'Failed to create profile: ' + createError.message });
      }

      // Update auth metadata
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { 
          ...metadata,
          full_name: name,
          display_name: name,
          username: uniqueUsername
        }
      });

      return res.json({ data: newProfile });
    } else {
      // Update existing profile if needed
      const updates = {};
      
      if (!existingProfile.username) {
        updates.username = await generateUniqueUsername(name, userId);
      }
      
      if (!existingProfile.full_name) {
        updates.full_name = name;
      }
      
      if (!existingProfile.email) {
        updates.email = user.email;
      }
      
      if (Object.keys(updates).length > 0) {
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();

        if (updateError) {
          return res.status(400).json({ error: 'Failed to update profile: ' + updateError.message });
        }

        // Update auth metadata
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { 
            ...metadata,
            full_name: updatedProfile.full_name,
            display_name: updatedProfile.full_name,
            username: updatedProfile.username
          }
        });

        return res.json({ data: updatedProfile });
      }
      
      return res.json({ data: existingProfile });
    }
  } catch (err) {
    console.error('[refreshProfile] Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Filter out any undefined or null values and fields that shouldn't be updated
    const cleanUpdates = {};
    const allowedFields = [
      'username', 'full_name', 'email', 'phone', 'avatar_url', 'city', 'address',
      'swap_score', 'total_swaps', 'total_listings', 'is_verified', 'cnic_submitted'
    ];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined && value !== null) {
        cleanUpdates[key] = value;
      }
    }

    // Always update the created_at timestamp for new records, don't update updated_at (will be handled by trigger)
    if (!cleanUpdates.created_at) {
      cleanUpdates.created_at = new Date().toISOString();
    }

    // First try to update existing profile
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(cleanUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const profileData = {
        id: userId,
        created_at: new Date().toISOString(),
        ...cleanUpdates
      };

      // Generate username if not provided
      if (!profileData.username && (profileData.full_name || profileData.email)) {
        const baseName = profileData.full_name || profileData.email.split('@')[0];
        profileData.username = await generateUniqueUsername(baseName, userId);
      }

      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (createError) {
        console.error('[updateProfile] Profile creation error:', createError.message);
        return res.status(400).json({ error: 'Failed to create profile: ' + createError.message });
      }

      return res.json({ data: newProfile });
    }

    if (error) {
      console.error('[updateProfile] error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    res.json({ data });
  } catch (err) {
    console.error('[updateProfile] Unexpected error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
