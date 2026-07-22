const { supabase, supabaseAdmin } = require('../config/supabase');

exports.getMyRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('swap_requests')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.createSwapRequest = async (req, res) => {
  try {
    const requestData = req.body;
    const { data, error } = await supabaseAdmin
      .from('swap_requests')
      .insert(requestData)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateSwapRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabaseAdmin
      .from('swap_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
