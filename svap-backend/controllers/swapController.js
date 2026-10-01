const { supabase, supabaseAdmin } = require('../config/supabase');

const PROFILE_FALLBACK = { username: null, avatar_url: null };
const ACTIVE_REQUEST_MESSAGE = 'You already have an active request for this item.';

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

    // Rejected requests are hidden; accepted requests remain visible for checkout.
    const filtered = (data || []).filter((r) => {
      if (r.status === 'pending') {
        // Keep expired requests visible until the server worker marks them cancelled.
        return true;
      }
      if (r.status === 'accepted' || r.status === 'completed' || r.status === 'cancelled') return true;
      if (r.status === 'rejected') return false;
      // unavailable → hide
      return false;
    });

    const hydrated = await attachRequestProfiles(filtered);
    res.json({ data: hydrated });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ── GET /api/swap-requests/check/:userId/:productId ────────────────────────
// Check if user has an active pending or accepted request for this product.
exports.checkSwapEligibility = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('swap_requests')
      .select('id, status, expires_at')
      .eq('from_user_id', userId)
      .eq('requested_product_id', productId)
      .in('status', ['pending', 'accepted']);

    if (error) return res.status(400).json({ error: error.message });

    const hasActiveRequest = (data || []).some((request) =>
      request.status === 'accepted' || (request.status === 'pending' && new Date(request.expires_at).getTime() > Date.now())
    );
    res.json({ canSend: !hasActiveRequest, nextAvailable: null, code: hasActiveRequest ? 'ACTIVE_REQUEST_EXISTS' : null });
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

    // Prevent duplicate offers only while a matching request is pending or accepted.
    const { data: existingRequests, error: checkError } = await supabaseAdmin
      .from('swap_requests')
      .select('id, status, expires_at')
      .eq('from_user_id', from_user_id)
      .eq('requested_product_id', requested_product_id)
      .in('status', ['pending', 'accepted']);

    if (checkError) {
      console.error('[active-request-check]', checkError.message);
      return res.status(400).json({ error: checkError.message });
    }

    const hasActiveRequest = (existingRequests || []).some((request) =>
      request.status === 'accepted' || new Date(request.expires_at).getTime() > Date.now()
    );
    if (hasActiveRequest) {
      return res.status(409).json({ error: ACTIVE_REQUEST_MESSAGE, code: 'ACTIVE_REQUEST_EXISTS' });
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
    const { status, updated_by } = req.body;

    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Unsupported svap request status' });
    }

    const { data: current, error: fetchError } = await supabaseAdmin
      .from('swap_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !current) return res.status(404).json({ error: 'Svap request not found' });

    if (status === 'cancelled') {
      const isParticipant = updated_by === current.from_user_id || updated_by === current.to_user_id;
      if (!isParticipant) return res.status(403).json({ error: 'Only a svap participant can cancel this request' });
      if (current.status !== 'accepted') {
        return res.status(409).json({ error: 'Only an accepted svap can be cancelled here' });
      }

      const { count, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('swap_request_id', id);

      if (ordersError) return res.status(500).json({ error: ordersError.message });
      if (count > 0) {
        return res.status(409).json({ error: 'Checkout has already started. Contact support to cancel the order.' });
      }
    } else {
      if (current.status === 'pending' && new Date(current.expires_at).getTime() <= Date.now()) {
        return res.status(409).json({ error: 'This svap request expired after 48 hours' });
      }
      if (updated_by !== current.to_user_id) {
        return res.status(403).json({ error: 'Only the receiving user can accept or reject this request' });
      }
      if (current.status !== 'pending') {
        return res.status(409).json({ error: 'This request is no longer pending' });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('swap_requests')
      .update({ status })
      .eq('id', id)
      .eq('status', current.status)
      .select('*, offered:products!offered_product_id(title, image_urls), requested:products!requested_product_id(title, image_urls)')
      .single();

    if (error || !data) return res.status(409).json({ error: error?.message || 'Request status changed; refresh and try again' });
    const hydrated = await attachRequestProfiles(data);

    if (status === 'rejected') {
      await supabaseAdmin.from('notifications').insert({
        user_id: hydrated.from_user_id,
        type: 'swap_rejected',
        title: 'Request Rejected',
        body: 'Your SVAP request has been rejected',
        route: '/requests',
        is_read: false,
      });
    }

    if (status === 'cancelled') {
      const participantIds = [...new Set([hydrated.from_user_id, hydrated.to_user_id])];
      const { error: notificationError } = await supabaseAdmin.from('notifications').insert(
        participantIds.map((user_id) => ({
          user_id,
          type: 'swap_cancelled',
          title: 'SVAP Cancelled',
          body: 'This SVAP has been cancelled.',
          route: '/requests',
          is_read: false,
        }))
      );
      if (notificationError) {
        console.error('[cancelSwapRequest] Notification insert failed:', notificationError.message);
      }
    }

    res.json({ data: hydrated });
  } catch (err) {
    console.error('[updateSwapRequestStatus]', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};