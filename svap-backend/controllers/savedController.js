const { supabaseAdmin } = require('../config/supabase');

// GET /api/saved/:userId — get all saved products with product details
exports.getSaved = async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('saved_products')
      .select('*, product:products!product_id(id, title, image_urls, condition, swap_for, status, profiles(username, avatar_url, city))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    // Filter out swapped products
    const active = (data || []).filter(row => row.product?.status === 'active' || !row.product?.status);
    res.json({ data: active });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /api/saved — save a product
exports.saveProduct = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    if (!user_id || !product_id) return res.status(400).json({ error: 'user_id and product_id required' });

    // Upsert to avoid duplicates
    const { data, error } = await supabaseAdmin
      .from('saved_products')
      .upsert({ user_id, product_id }, { onConflict: 'user_id,product_id' })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE /api/saved — unsave a product
exports.unsaveProduct = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    if (!user_id || !product_id) return res.status(400).json({ error: 'user_id and product_id required' });

    const { error } = await supabaseAdmin
      .from('saved_products')
      .delete()
      .eq('user_id', user_id)
      .eq('product_id', product_id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /api/saved/:userId/ids — just product IDs (for checking saved state)
exports.getSavedIds = async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('saved_products')
      .select('product_id')
      .eq('user_id', userId);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: (data || []).map(r => r.product_id) });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
