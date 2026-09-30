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

    // Filter active-only when requested (listings page + svap modal)
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
    const productData = req.body || {};
    const requiredTextFields = ['user_id', 'title', 'description', 'category', 'condition', 'swap_for'];
    const missingFields = requiredTextFields.filter((field) =>
      typeof productData[field] !== 'string' || !productData[field].trim()
    );
    const estimatedValue = Number(productData.estimated_value);
    if (!Number.isSafeInteger(estimatedValue) || estimatedValue <= 0 || estimatedValue > 2147483647) missingFields.push('estimated_value');
    if (!Array.isArray(productData.image_urls) || productData.image_urls.length === 0) missingFields.push('image_urls');
    if (typeof productData.video_url !== 'string' || !productData.video_url.trim()) missingFields.push('video_url');
    if (missingFields.length) {
      return res.status(400).json({ error: 'Required listing fields are missing or invalid', fields: missingFields });
    }
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


// GET /api/products/:id/questions
exports.getProductQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('product_questions')
      .select('*, profiles(username, full_name, avatar_url)')
      .eq('product_id', id)
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ data: data || [] });
  } catch (err) {
    console.error('[getProductQuestions]', err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /api/products/:id/questions
exports.createProductQuestion = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { user_id, question } = req.body || {};
    const cleanQuestion = typeof question === 'string' ? question.trim() : '';
    if (!user_id || !cleanQuestion) return res.status(400).json({ error: 'user_id and question are required' });
    if (cleanQuestion.length > 1000) return res.status(400).json({ error: 'Questions must be 1000 characters or fewer' });

    const { data: product, error: productError } = await supabaseAdmin
      .from('products').select('id, user_id, title').eq('id', productId).single();
    if (productError || !product) return res.status(404).json({ error: 'Product not found' });

    const { data, error } = await supabaseAdmin
      .from('product_questions')
      .insert({ product_id: productId, user_id, question: cleanQuestion })
      .select('*, profiles(username, full_name, avatar_url)')
      .single();
    if (error) return res.status(400).json({ error: error.message });

    if (user_id !== product.user_id) {
      const { data: asker } = await supabaseAdmin
        .from('profiles').select('username, full_name').eq('id', user_id).maybeSingle();
      const askerName = asker?.username || asker?.full_name || 'A user';
      await supabaseAdmin.from('notifications').insert({
        user_id: product.user_id,
        type: 'product_question',
        title: 'New question about your listing',
        body: askerName + ' asked: ' + cleanQuestion.slice(0, 180),
        route: '/product/' + productId,
        is_read: false,
      });
    }
    return res.status(201).json({ data });
  } catch (err) {
    console.error('[createProductQuestion]', err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PATCH /api/products/:id/questions/:questionId/answer
exports.answerProductQuestion = async (req, res) => {
  try {
    const { id: productId, questionId } = req.params;
    const { user_id, answer } = req.body || {};
    const cleanAnswer = typeof answer === 'string' ? answer.trim() : '';
    if (!user_id || !cleanAnswer) return res.status(400).json({ error: 'user_id and answer are required' });
    if (cleanAnswer.length > 1000) return res.status(400).json({ error: 'Answers must be 1000 characters or fewer' });

    const { data: product, error: productError } = await supabaseAdmin
      .from('products').select('id, user_id, title').eq('id', productId).single();
    if (productError || !product) return res.status(404).json({ error: 'Product not found' });
    if (product.user_id !== user_id) return res.status(403).json({ error: 'Only the listing owner can answer questions' });

    const { data: questionRow, error: questionError } = await supabaseAdmin
      .from('product_questions')
      .update({ answer: cleanAnswer })
      .eq('id', questionId)
      .eq('product_id', productId)
      .select('*, profiles(username, full_name, avatar_url)')
      .single();
    if (questionError || !questionRow) return res.status(404).json({ error: 'Question not found' });

    await supabaseAdmin.from('notifications').insert({
      user_id: questionRow.user_id,
      type: 'product_answer',
      title: 'Your question was answered',
      body: 'The seller answered your question about ' + product.title + '.',
      route: '/product/' + productId,
      is_read: false,
    });
    return res.json({ data: questionRow });
  } catch (err) {
    console.error('[answerProductQuestion]', err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
