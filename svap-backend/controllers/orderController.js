const { supabaseAdmin } = require('../config/supabase');

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
      status: requestedStatus,
    } = req.body;

    // Allow 'pending_verification' from swap checkout, otherwise default to 'pending'
    const allowedStatuses = ['pending', 'pending_verification'];
    const orderStatus = allowedStatuses.includes(requestedStatus) ? requestedStatus : 'pending';

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
        shipping_cost,
        discount: discount || 0,
        total,
        tracking_number: tracking_number || null,
        transaction_ref: transaction_ref || null,
        status: orderStatus,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({ error: error.message });
    }

    // Once a product is checked out, competing pending swap requests for it
    // are no longer actionable, whether checkout started from a swap or a listing.
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
            type: 'swap_accepted',
            title: 'Swap Checkout Ready',
            body: 'The receiver has completed checkout. Your svap order is ready to review.',
            route: '/requests',
            is_read: false,
          });
        }
        
        // Check if the other user has already placed an order for this swap
        const { count: otherUserOrdersCount } = await supabaseAdmin
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('swap_request_id', swap_request_id)
          .neq('from_user_id', from_user_id);

        if (otherUserOrdersCount > 0) {
          // Both users have now checked out. Mark swap request as completed.
          await supabaseAdmin
            .from('swap_requests')
            .update({ status: 'completed' })
            .eq('id', swap_request_id);
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
          console.error('Error resolving competing swap requests (requested):', competingError);
        } else if (competingRequests?.length) {
          await Promise.all(
            competingRequests.map((request) =>
              supabaseAdmin.from('notifications').insert({
                user_id: request.from_user_id,
                type: 'swap_unavailable',
                title: 'Product Already Swapped',
                body: 'This product has already been swapped with another user.',
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
          console.error('Error resolving competing swap requests (offered):', offeredError);
        } else if (competingOffered?.length) {
          await Promise.all(
            competingOffered.map((request) =>
              supabaseAdmin.from('notifications').insert({
                user_id: request.from_user_id,
                type: 'swap_unavailable',
                title: 'Product Already Swapped',
                body: 'This product has already been swapped with another user.',
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
      .select('*')
      .or(`from_user_id.eq.${user_id},to_user_id.eq.${user_id}`)
      .in('status', ['pending', 'pending_verification', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled'])
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