const { supabase, supabaseAdmin } = require('../config/supabase');

const PROFILE_FALLBACK = { username: null, avatar_url: null };
const COOLDOWN_MESSAGE = 'You Have Already Sent a Request for This Item in the Last 24 Hours. Please Wait Before Sending Another Request.';

const attachRequestProfiles = async (requests) => {
  const rows = Array.isArray(requests) ? requests : [requests].filter(Boolean);
  if (rows.length === 0) return requests;

  const profileIds = [
    ...new Set(rows.flatMap((row) => [row.from_user_id, row.to_user_id]).filter(Boolean)),
  ];

  if (profileIds.length === 0) return requests;

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', profileIds);

  if (error) {
    console.error('[profile-hydration]', error.message);
    return requests;
  }

  const profileById = new Map(
    (profiles || []).map((profile) => [
      profile.id,
      {
        username: profile.username || profile.full_name || null,
        avatar_url: profile.avatar_url || null,
      },
    ])
  );

  const hydrated = rows.map((row) => ({
    ...row,
    from_profile: profileById.get(row.from_user_id) || PROFILE_FALLBACK,
    to_profile: profileById.get(row.to_user_id) || PROFILE_FALLBACK,
  }));

  return Array.isArray(requests) ? hydrated : hydrated[0];
};

// ── GET /api/swap-requests/user/:userId ────────────────────────────────────
exports.getMyRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('swap_requests')
      .select(`
        *,
        offered:products!offered_product_id(title, image_urls),
        requested:products!requested_product_id(title, image_urls)
      `)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    const hydrated = await attachRequestProfiles(data || []);
    res.json({ data: hydrated });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ── GET /api/swap-requests/check/:userId/:productId ────────────────────────
// Check if user can send a swap request for a specific product (24h limit)
exports.checkSwapEligibility = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('swap_requests')
      .select('id, created_at')
      .eq('from_user_id', userId)
      .eq('requested_product_id', productId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (error) return res.status(400).json({ error: error.message });

    const canSend = !data || data.length === 0;
    const nextAvailable = data && data.length > 0 
      ? new Date(new Date(data[0].created_at).getTime() + 24 * 60 * 60 * 1000).toISOString()
      : null;

    res.json({ canSend, nextAvailable });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ── POST /api/swap-requests ────────────────────────────────────────────────
exports.createSwapRequest = async (req, res) => {
  try {
    const { from_user_id, to_user_id, offered_product_id, requested_product_id } = req.body;

    if (!from_user_id || !to_user_id || !offered_product_id || !requested_product_id) {
      return res.status(400).json({ error: 'from_user_id, to_user_id, offered_product_id, requested_product_id are required' });
    }

    // ── 24-HOUR LIMIT CHECK ──
    // Check if user already sent a request for this product in the last 24 hours
    const { data: existingRequests, error: checkError } = await supabaseAdmin
      .from('swap_requests')
      .select('id, created_at')
      .eq('from_user_id', from_user_id)
      .eq('requested_product_id', requested_product_id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (checkError) {
      console.error('[24h-check]', checkError.message);
      return res.status(400).json({ error: checkError.message });
    }

    if (existingRequests && existingRequests.length > 0) {
      return res.status(429).json({ 
        error: COOLDOWN_MESSAGE,
        code: 'RATE_LIMIT_24H'
      });
    }

    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: swapData, error: swapError } = await supabaseAdmin
      .from('swap_requests')
      .insert({ from_user_id, to_user_id, offered_product_id, requested_product_id, status: 'pending', expires_at })
      .select(`
        *,
        offered:products!offered_product_id(title, image_urls),
        requested:products!requested_product_id(title, image_urls)
      `)
      .single();

    if (swapError) return res.status(400).json({ error: swapError.message });
    const swapDataWithProfiles = await attachRequestProfiles(swapData);

    // Create notification for the receiver (to_user_id)
    const senderName = swapDataWithProfiles.from_profile?.username || 'Someone';
    const productTitle = swapDataWithProfiles.requested?.title || 'your item';

    await supabaseAdmin.from('notifications').insert({
      user_id: to_user_id,
      type: 'swap_request',
      title: 'New Swap Request',
      body: `@${senderName} wants to swap for your ${productTitle}`,
      route: '/requests',
      is_read: false,
    });

    res.json({ data: swapDataWithProfiles });
  } catch (err) {
    console.error('[createSwapRequest]', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ── PATCH /api/swap-requests/:id ───────────────────────────────────────────
exports.updateSwapRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updated_by } = req.body; // updated_by = userId of who is updating

    const { data, error } = await supabaseAdmin
      .from('swap_requests')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        offered:products!offered_product_id(title, image_urls),
        requested:products!requested_product_id(title, image_urls)
      `)
      .single();

    if (error) return res.status(400).json({ error: error.message });
    const hydrated = await attachRequestProfiles(data);

    // Notify the sender (from_user_id) about the status update
    if (hydrated && hydrated.from_user_id) {
      const updaterName = hydrated.to_profile?.username || 'Someone';
      const productTitle = hydrated.requested?.title || 'your item';
      const isAccepted = status === 'accepted';

      await supabaseAdmin.from('notifications').insert({
        user_id: hydrated.from_user_id,
        type: isAccepted ? 'swap_accepted' : 'swap_rejected',
        title: isAccepted ? 'Swap Request Accepted!' : 'Swap Request Rejected',
        body: isAccepted
          ? `@${updaterName} accepted your request — ${productTitle}`
          : `@${updaterName} rejected your request — ${productTitle}`,
        route: '/requests',
        is_read: false,
      });
    }

    res.json({ data: hydrated });
  } catch (err) {
    console.error('[updateSwapRequestStatus]', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
