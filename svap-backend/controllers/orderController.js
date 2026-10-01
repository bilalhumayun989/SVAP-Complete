const { supabaseAdmin } = require('../config/supabase');

const CASH_ONLY_RECIPIENT_DELIVERY_FEE = 500;

exports.createOrder = async (req, res) => {
  try {
    const { 
      swap_request_id,
      product_id,
      from_user_id,
      to_user_id,
      delivery_name,
      delivery_phone,
      delivery_address,
      delivery_city,
      payment_method,
      shipping_cost,
      discount,
      total,
      tracking_number,
      transaction_ref,
    } = req.body;

    // Every newly submitted checkout starts in the payment verification state.
    // Validate the svap before accepting a checkout submission.
    if (swap_request_id) {
      const { data: swapBeforeOrder, error: swapLookupError } = await supabaseAdmin
        .from('swap_requests')
        .select('id, status, from_user_id, to_user_id, offered_product_id, premium_amount, expires_at')
        .eq('id', swap_request_id)
        .single();
      if (swapLookupError || !swapBeforeOrder) return res.status(404).json({ error: 'Svap request not found' });
      if (!['accepted', 'completed'].includes(swapBeforeOrder.status)) return res.status(409).json({ error: 'This svap is no longer available for checkout' });
      if (![swapBeforeOrder.from_user_id, swapBeforeOrder.to_user_id].includes(from_user_id)) return res.status(403).json({ error: 'Only a svap participant can checkout this request' });
      if (new Date(swapBeforeOrder.expires_at).getTime() <= Date.now()) return res.status(409).json({ error: 'This svap expired after 48 hours and was cancelled' });
      const cashOfferAmount = Number(swapBeforeOrder.premium_amount || 0);
      if (!Number.isFinite(cashOfferAmount) || cashOfferAmount < 0) {
        return res.status(409).json({ error: 'This cash offer has an invalid amount' });
      }
      const isCashOnlyOffer = !swapBeforeOrder.offered_product_id;
      const isCashOfferPayer = from_user_id === swapBeforeOrder.from_user_id;
      if (isCashOnlyOffer && isCashOfferPayer && cashOfferAmount <= 0) {
        return res.status(409).json({ error: 'This cash offer has no valid amount to pay' });
      }
      req.checkoutPricing = isCashOnlyOffer
        ? {
            shippingCost: isCashOfferPayer ? 0 : CASH_ONLY_RECIPIENT_DELIVERY_FEE,
            total: isCashOfferPayer ? cashOfferAmount : CASH_ONLY_RECIPIENT_DELIVERY_FEE,
            premiumAmount: cashOfferAmount,
          }
        : {
            shippingCost: CASH_ONLY_RECIPIENT_DELIVERY_FEE,
            total: CASH_ONLY_RECIPIENT_DELIVERY_FEE + (isCashOfferPayer ? cashOfferAmount : 0),
            premiumAmount: cashOfferAmount,
          };
      if (swapBeforeOrder.status === 'completed') {
        const { count: ownOrderCount, error: ownOrderError } = await supabaseAdmin
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('swap_request_id', swap_request_id)
          .eq('from_user_id', from_user_id);
        if (ownOrderError) return res.status(500).json({ error: 'Could not verify this user checkout state' });
        if (ownOrderCount > 0) return res.status(409).json({ error: 'You have already completed checkout for this svap' });
      }
    }

    const orderStatus = "payment_verification";

    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert({
        swap_request_id: swap_request_id || null,
        from_user_id,
        to_user_id: to_user_id || from_user_id,
        delivery_name,
        delivery_phone,
        delivery_address,
        delivery_city,
        payment_method,
        shipping_cost: req.checkoutPricing?.shippingCost ?? shipping_cost,
        discount: discount || 0,
        total: req.checkoutPricing?.total ?? total,
        tracking_number: tracking_number || null,
        transaction_ref: transaction_ref || null,
        premium_amount: req.checkoutPricing?.premiumAmount ?? 0,
        status: orderStatus,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({ error: error.message });
    }

    if (swap_request_id) {
      const { data: swapAfterInsert, error: statusCheckError } = await supabaseAdmin
        .from('swap_requests')
        .select('status, expires_at')
        .eq('id', swap_request_id)
        .single();
      if (statusCheckError || !['accepted', 'completed'].includes(swapAfterInsert?.status) || new Date(swapAfterInsert.expires_at).getTime() <= Date.now()) {
        await supabaseAdmin.from('orders').delete().eq('id', data.id);
        return res.status(409).json({ error: 'This svap was cancelled before checkout completed' });
      }
    }

    // Once a product is checked out, competing pending svap requests for it
    // are no longer actionable, whether checkout started from a svap or a listing.
    if (swap_request_id || product_id) {
      let requestedProductId = product_id;
      let offeredProductId = null;

      if (swap_request_id) {
        const { data: swapRequest } = await supabaseAdmin
          .from('swap_requests')
          .select('requested_product_id, offered_product_id, status, from_user_id, to_user_id')
          .eq('id', swap_request_id)
          .single();
        requestedProductId = swapRequest?.requested_product_id;
        offeredProductId = swapRequest?.offered_product_id;

        if (swapRequest?.status === 'accepted' && from_user_id !== swapRequest.from_user_id) {
          await supabaseAdmin.from('notifications').insert({
            user_id: swapRequest.from_user_id,
            type: 'swap_partner_checkout_completed',
            title: 'SVAP Partner Checked Out',
            body: 'Your SVAP partner has completed checkout. Complete your own checkout to continue. Order ID: ' + data.id,
            route: '/requests',
            is_read: false,
          });
        }
        
        // Only the other participant's checkout should complete this swap.
        // A stale/duplicate order from an unrelated user must not hide the
        // request from the participant who still needs to check out.
        const otherParticipantId = from_user_id === swapRequest?.from_user_id
          ? swapRequest?.to_user_id
          : swapRequest?.from_user_id;
        const { count: otherUserOrdersCount, error: otherOrdersError } = await supabaseAdmin
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('swap_request_id', swap_request_id)
          .eq('from_user_id', otherParticipantId);

        if (otherOrdersError) {
          console.error('[createOrder] Could not check other participant checkout:', otherOrdersError);
          return res.status(500).json({ error: 'Could not verify the other participant checkout' });
        }

        console.log(`[createOrder] Svap ${swap_request_id}:`, {
          currentUser: from_user_id,
          otherUserOrdersCount,
          otherParticipantId,
        });

        if (otherUserOrdersCount > 0) {
          // Both users have now checked out. Mark svap request as completed.
          console.log(`[createOrder] Marking svap ${swap_request_id} as completed - both users checked out`);
          await supabaseAdmin
            .from('swap_requests')
            .update({ status: 'completed' })
            .eq('id', swap_request_id);
        } else {
          // Only one user has checked out. Keep status as 'accepted', don't change it.
          console.log(`[createOrder] First user checked out for svap ${swap_request_id}, keeping status as accepted`);
        }
      }

      // Mark competing requests for the REQUESTED product as unavailable
      if (requestedProductId) {
        const { data: competingRequests, error: competingError } = await supabaseAdmin
          .from('swap_requests')
          .update({ status: 'unavailable' })
          .eq('requested_product_id', requestedProductId)
          .eq('status', 'pending')
          .neq('id', swap_request_id)
          .select('id, from_user_id');

        if (competingError) {
          console.error('Error resolving competing svap requests (requested):', competingError);
        } else if (competingRequests?.length) {
          await Promise.all(
            competingRequests.map((request) =>
              supabaseAdmin.from('notifications').insert({
                user_id: request.from_user_id,
                type: 'swap_unavailable',
                title: 'Product Is In Another SVAP',
                body: 'This product is now part of another SVAP. Order ID: ' + data.id,
                route: '/requests',
                is_read: false,
              })
            )
          );
        }
      }

      // Also mark competing requests for the OFFERED product as unavailable
      if (offeredProductId) {
        const { data: competingOffered, error: offeredError } = await supabaseAdmin
          .from('swap_requests')
          .update({ status: 'unavailable' })
          .or(`offered_product_id.eq.${offeredProductId},requested_product_id.eq.${offeredProductId}`)
          .eq('status', 'pending')
          .neq('id', swap_request_id)
          .select('id, from_user_id');

        if (offeredError) {
          console.error('Error resolving competing svap requests (offered):', offeredError);
        } else if (competingOffered?.length) {
          await Promise.all(
            competingOffered.map((request) =>
              supabaseAdmin.from('notifications').insert({
                user_id: request.from_user_id,
                type: 'swap_unavailable',
                title: 'Product Is In Another SVAP',
                body: 'This product is now part of another SVAP. Order ID: ' + data.id,
                route: '/requests',
                is_read: false,
              })
            )
          );
        }
      }
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('id, swap_request_id, from_user_id, to_user_id, delivery_name, delivery_phone, delivery_address, delivery_city, payment_method, shipping_cost, discount, total, status, transaction_ref, created_at')
      .or(`from_user_id.eq.${user_id},to_user_id.eq.${user_id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ error: error.message });
    }

    const orders = data || [];
    // Only track swap_request_ids where THIS user placed the order
    // (not orders where they are just the to_user_id / recipient)
    const orderRequestIds = new Set(
      orders
        .filter((order) => order.from_user_id === user_id)
        .map((order) => order.swap_request_id)
        .filter(Boolean)
    );

    // Accepted swaps are checkout records even before the delivery order exists.
    // Include them so the Orders page and Requests > Checkout stay consistent.
    const { data: checkoutRequests, error: checkoutError } = await supabaseAdmin
      .from('swap_requests')
      .select('id, from_user_id, to_user_id, status, created_at')
      .or(`from_user_id.eq.${user_id},to_user_id.eq.${user_id}`)
      .in('status', ['accepted', 'completed'])
      .order('created_at', { ascending: false });

    if (checkoutError) {
      console.error('Error fetching checkout requests:', checkoutError);
      return res.json(orders);
    }

    const pendingCheckoutRecords = (checkoutRequests || [])
      .filter((request) => !orderRequestIds.has(request.id))
      .map((request) => ({
        id: `checkout-${request.id}`,
        swap_request_id: request.id,
        from_user_id: request.from_user_id,
        to_user_id: request.to_user_id,
        delivery_name: 'Checkout pending',
        delivery_phone: '',
        delivery_address: 'Complete checkout from Requests',
        delivery_city: '',
        payment_method: 'Awaiting checkout',
        shipping_cost: 0,
        discount: 0,
        total: 0,
        status: 'pending',
        tracking_number: null,
        transaction_ref: null,
        created_at: request.created_at,
        is_checkout_pending: true,
      }));

    res.json([...orders, ...pendingCheckoutRecords]);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, user_id } = req.body;

    if (status !== 'completed') {
      return res.status(400).json({ error: 'Only completed status is supported' });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)
      .or(`from_user_id.eq.${user_id},to_user_id.eq.${user_id}`)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
