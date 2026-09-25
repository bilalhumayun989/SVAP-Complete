const { supabase, supabaseAdmin } = require('../config/supabase');

const PROFILE_FALLBACK = { username: null, avatar_url: null };
const COOLDOWN_MESSAGE = 'You Have Already Sent a Request for This Item in the Last 48 Hours. Please Wait Before Sending Another Request.';

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
    const now = new Date().toISOString();

    // Fetch all requests for the user
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

    // Filter to match mobile app behavior:
    // 1. pending   → only if NOT expired (expires_at > now)
    // 2. accepted  → always show (they are in checkout flow)
    // 3. rejected  → show only last 48 hours (user awareness)
    // 4. completed/unavailable → hide (clutter, mobile hides these)
    const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const filtered = (data || []).filter((r) => {
      if (r.status === 'pending') {
        // Only show pending if not yet expired
        return new Date(r.expires_at).getTime() > Date.now();
      }
      if (r.status === 'accepted') return true;
      if (r.status === 'rejected') {
        // Show rejected only within last 48 hours
        return new Date(r.created_at).getTime() > new Date(cutoff48h).getTime();
      }
      // completed, unavailable → hide
      return false;
    });

    const hydrated = await attachRequestProfiles(filtered);
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
    const {
      from_user_id,
      to_user_id,
      offered_product_id,
      requested_product_id,
      premium_amount,
      is_cash_only,
      cash_amount,
    } = req.body;
    const isCashOnly = Boolean(is_cash_only);
    const normalizedCashAmount = Number(cash_amount ?? premium_amount);

    if (!from_user_id || !to_user_id || !requested_product_id) {
      return res.status(400).json({ error: 'from_user_id, to_user_id and requested_product_id are required' });
    }
    if (isCashOnly && (!Number.isFinite(normalizedCashAmount) || normalizedCashAmount <= 0)) {
      return res.status(400).json({ error: 'A valid cash amount is required for a cash-only offer' });
    }
    if (!isCashOnly && premium_amount !== undefined && premium_amount !== null &&
      (!Number.isFinite(Number(premium_amount)) || Number(premium_amount) < 0)) {
      return res.status(400).json({ error: 'Cash amount must be zero or a positive number' });
    }
    if (!isCashOnly && !offered_product_id) {
      return res.status(400).json({ error: 'offered_product_id is required for an item offer' });
    }

    // ── 48-HOUR LIMIT CHECK ──
    // Check if user already sent a request for this product in the last 48 hours
    const { data: existingRequests, error: checkError } = await supabaseAdmin
      .from('swap_requests')
      .select('id, created_at')
      .eq('from_user_id', from_user_id)
      .eq('requested_product_id', requested_product_id)
      .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (checkError) {
      console.error('[48h-check]', checkError.message);
      return res.status(400).json({ error: checkError.message });
    }

    if (existingRequests && existingRequests.length > 0) {
      return res.status(429).json({ 
        error: COOLDOWN_MESSAGE,
        code: 'RATE_LIMIT_48H'
      });
    }

    const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const insertPayload = {
      from_user_id,
      to_user_id,
      offered_product_id: isCashOnly ? null : offered_product_id,
      requested_product_id,
      status: 'pending',
      expires_at,
      premium_amount: isCashOnly
        ? normalizedCashAmount
        : Math.max(0, Number(premium_amount) || 0),
    };

    const { data: swapData, error: swapError } = await supabaseAdmin
      .from('swap_requests')
      .insert(insertPayload)
      .select(`
        *,
        offered:products!offered_product_id(title, image_urls),
        requested:products!requested_product_id(title, image_urls)
      `)
      .single();

    if (swapError) return res.status(400).json({ error: swapError.message });
    const swapDataWithProfiles = await attachRequestProfiles(swapData);

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

    // Acceptance only unlocks checkout. Notify the sender after the receiver
    // actually completes checkout in the order controller.
    if (hydrated && hydrated.from_user_id && status === 'rejected') {
      const updaterName = hydrated.to_profile?.username || 'Someone';
      const productTitle = hydrated.requested?.title || 'your item';

      await supabaseAdmin.from('notifications').insert({
        user_id: hydrated.from_user_id,
        type: 'swap_rejected',
        title: 'Swap Request Rejected',
        body: `@${updaterName} rejected your request — ${productTitle}`,
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
