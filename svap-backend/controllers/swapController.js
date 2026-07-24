const { supabase, supabaseAdmin } = require('../config/supabase');

// ── GET /api/swap-requests/user/:userId ────────────────────────────────────
exports.getMyRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('swap_requests')
      .select(`
        *,
        offered:products!offered_product_id(title, image_urls),
        requested:products!requested_product_id(title, image_urls),
        from_profile:profiles!from_user_id(username, avatar_url),
        to_profile:profiles!to_user_id(username, avatar_url)
      `)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
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

    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: swapData, error: swapError } = await supabaseAdmin
      .from('swap_requests')
      .insert({ from_user_id, to_user_id, offered_product_id, requested_product_id, status: 'pending', expires_at })
      .select(`
        *,
        offered:products!offered_product_id(title, image_urls),
        requested:products!requested_product_id(title, image_urls),
        from_profile:profiles!from_user_id(username, avatar_url),
        to_profile:profiles!to_user_id(username, avatar_url)
      `)
      .single();

    if (swapError) return res.status(400).json({ error: swapError.message });

    // Create notification for the receiver (to_user_id)
    const senderName = swapData.from_profile?.username || 'Someone';
    const productTitle = swapData.requested?.title || 'your item';

    await supabaseAdmin.from('notifications').insert({
      user_id: to_user_id,
      type: 'swap_request',
      title: 'New Swap Request',
      body: `@${senderName} wants to swap for your ${productTitle}`,
      route: '/requests',
      is_read: false,
    });

    res.json({ data: swapData });
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
        requested:products!requested_product_id(title, image_urls),
        from_profile:profiles!from_user_id(username, avatar_url),
        to_profile:profiles!to_user_id(username, avatar_url)
      `)
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Notify the sender (from_user_id) about the status update
    if (data && data.from_user_id) {
      const updaterName = data.to_profile?.username || 'Someone';
      const productTitle = data.requested?.title || 'your item';
      const isAccepted = status === 'accepted';

      await supabaseAdmin.from('notifications').insert({
        user_id: data.from_user_id,
        type: isAccepted ? 'swap_accepted' : 'swap_rejected',
        title: isAccepted ? 'Swap Request Accepted!' : 'Swap Request Rejected',
        body: isAccepted
          ? `@${updaterName} ne aapki swap request accept kar li — ${productTitle}`
          : `@${updaterName} ne aapki swap request reject kar di — ${productTitle}`,
        route: '/requests',
        is_read: false,
      });
    }

    res.json({ data });
  } catch (err) {
    console.error('[updateSwapRequestStatus]', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
