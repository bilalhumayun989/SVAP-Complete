const { supabaseAdmin } = require('../config/supabase');

exports.createOrder = async (req, res) => {
  try {
    const { 
      swap_request_id,
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
