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
      tracking_number
    } = req.body;

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
        tracking_number,
        status: 'pending'
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

      if (swap_request_id) {
        const { data: swapRequest } = await supabaseAdmin
          .from('swap_requests')
          .select('requested_product_id, status, from_user_id, to_user_id')
          .eq('id', swap_request_id)
          .single();
        requestedProductId = swapRequest?.requested_product_id;

        if (swapRequest?.status === 'accepted' && from_user_id !== swapRequest.from_user_id) {
          await supabaseAdmin.from('notifications').insert({
            user_id: swapRequest.from_user_id,
            type: 'swap_accepted',
            title: 'Swap Checkout Ready',
            body: 'The receiver has completed checkout. Your swap order is ready to review.',
            route: '/requests',
            is_read: false,
          });
        }
      }

      if (requestedProductId) {
        const { data: competingRequests, error: competingError } = await supabaseAdmin
          .from('swap_requests')
          .update({ status: 'rejected' })
          .eq('requested_product_id', requestedProductId)
          .eq('status', 'pending')
          .neq('id', swap_request_id)
          .select('id, from_user_id');

        if (competingError) {
          console.error('Error resolving competing swap requests:', competingError);
        } else if (competingRequests?.length) {
          await Promise.all(
            competingRequests.map((request) =>
              supabaseAdmin.from('notifications').insert({
                user_id: request.from_user_id,
                type: 'swap_rejected',
                title: 'Swap Request Unavailable',
                body: 'This product has already been checked out by another user.',
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
      .eq('from_user_id', user_id)
      .in('status', ['pending', 'completed', 'delivered'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
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
      .eq('from_user_id', user_id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
