const { supabase, supabaseAdmin } = require('../config/supabase');

const sevenDaysAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

// ── Synonym map ────────────────────────────────────────────────────────────────
const SYNONYMS = {
  phone:      ['mobile', 'smartphone', 'cell', 'handset', 'iphone', 'android'],
  mobile:     ['phone', 'smartphone', 'cell', 'handset'],
  smartphone: ['phone', 'mobile', 'cell', 'android', 'iphone'],
  laptop:     ['notebook', 'computer', 'macbook', 'chromebook'],
  notebook:   ['laptop', 'computer'],
  computer:   ['laptop', 'notebook', 'pc', 'desktop'],
  tv:         ['television', 'monitor', 'screen', 'display'],
  television: ['tv', 'monitor', 'screen'],
  headphone:  ['earphone', 'earbuds', 'headset', 'airpods'],
  earphone:   ['headphone', 'earbuds', 'headset'],
  earbuds:    ['headphone', 'earphone', 'airpods'],
  watch:      ['smartwatch', 'timepiece', 'wristwatch'],
  smartwatch: ['watch', 'wristwatch'],
  camera:     ['dslr', 'mirrorless', 'digicam', 'webcam'],
  bike:       ['motorcycle', 'motorbike', 'cycle', 'scooter'],
  car:        ['vehicle', 'automobile', 'auto'],
  sofa:       ['couch', 'settee', 'loveseat'],
  fridge:     ['refrigerator', 'freezer'],
  ac:         ['air conditioner', 'airconditioner', 'aircon', 'air-conditioner'],
  shoes:      ['sneakers', 'boots', 'footwear', 'trainers', 'joggers'],
  sneakers:   ['shoes', 'trainers', 'joggers', 'runners'],
  shirt:      ['top', 't-shirt', 'tshirt', 'polo'],
  tablet:     ['ipad', 'tab'],
  ipad:       ['tablet', 'tab'],
  game:       ['gaming', 'games', 'console', 'ps4', 'ps5', 'xbox'],
  console:    ['ps4', 'ps5', 'xbox', 'gaming', 'playstation'],
  ps5:        ['console', 'playstation', 'gaming'],
  ps4:        ['console', 'playstation', 'gaming'],
};

// Build all search terms (query + synonyms), deduplicated
function buildSearchTerms(query) {
  const q = query.toLowerCase().trim();
  const syns = SYNONYMS[q] || [];
  return [...new Set([q, ...syns])];
}

// Build Supabase OR filter across title, description, category
function buildOrFilter(terms) {
  const conditions = [];
  for (const term of terms) {
    const t = term.replace(/'/g, "''"); // escape single quotes
    conditions.push(`title.ilike.%${t}%`);
    conditions.push(`description.ilike.%${t}%`);
    conditions.push(`category.ilike.%${t}%`);
  }
  return conditions.join(',');
}

exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, stories } = req.query;
    const isStoriesRequest = stories === 'true' || stories === '1';

    let query = supabase
      .from('products')
      .select('*, profiles(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (isStoriesRequest) {
      query = query.gte('created_at', sevenDaysAgo());
    }

    if (category) query = query.eq('category', category);

    // Synonym-expanded multi-field search
    if (search) {
      const terms = buildSearchTerms(search);
      const orFilter = buildOrFilter(terms);
      query = query.or(orFilter);
    }

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getStories = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = supabase
      .from('products')
      .select('*, profiles(*)')
      .eq('status', 'active')
      .gte('created_at', sevenDaysAgo())
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);

    if (search) {
      const terms = buildSearchTerms(search);
      const orFilter = buildOrFilter(terms);
      query = query.or(orFilter);
    }

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles(*)')
      .eq('id', id)
      .single();

    if (error) return res.status(404).json({ error: 'Product not found' });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getProductsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { active } = req.query; // ?active=true for only active products

    let query = supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Filter active-only when requested (listings page + swap modal)
    if (active === 'true') {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
