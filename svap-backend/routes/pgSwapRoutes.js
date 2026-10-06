const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const SELECT = `sr.*, jsonb_build_object('title', op.title, 'image_urls', op.image_urls) offered, jsonb_build_object('title', rp.title, 'image_urls', rp.image_urls) requested, jsonb_build_object('username', fu.username, 'avatar_url', fu.avatar_url) from_profile, jsonb_build_object('username', tu.username, 'avatar_url', tu.avatar_url) to_profile`;
const JOINS = `FROM swap_requests sr LEFT JOIN products op ON op.id = sr.offered_product_id LEFT JOIN products rp ON rp.id = sr.requested_product_id LEFT JOIN profiles fu ON fu.id = sr.from_user_id LEFT JOIN profiles tu ON tu.id = sr.to_user_id`;

router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    const { rows } = await pool.query(
      `SELECT ${SELECT} ${JOINS} WHERE (sr.from_user_id = $1 OR sr.to_user_id = $1) AND sr.status NOT IN ('rejected', 'unavailable') ORDER BY sr.created_at DESC`,
      [req.userId]
    );
    res.json({ data: rows });
  } catch (e) {
    console.error('[pg swaps]', e.message);
    res.status(500).json({ error: 'Could not load requests' });
  }
});

router.get('/check/:userId/:productId', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    const { rows } = await pool.query(
      `SELECT id, status, expires_at FROM swap_requests WHERE from_user_id = $1 AND requested_product_id = $2 AND status IN ('pending', 'accepted') AND (status = 'accepted' OR expires_at > now())`,
      [req.userId, req.params.productId]
    );
    const active = rows.length > 0;
    res.json({ canSend: !active, nextAvailable: null, code: active ? 'ACTIVE_REQUEST_EXISTS' : null });
  } catch (e) {
    res.status(500).json({ error: 'Could not check request' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  const offered = b.offered_product_id || null;
  const requested = b.requested_product_id;
  try {
    if (!requested || !b.to_user_id || b.to_user_id === req.userId || (!offered && Number(b.cash_amount ?? b.premium_amount) <= 0)) {
      return res.status(400).json({ error: 'Invalid swap request' });
    }
    const { rows: existing } = await pool.query(
      `SELECT id FROM swap_requests WHERE from_user_id = $1 AND requested_product_id = $2 AND status IN ('pending', 'accepted') AND (status = 'accepted' OR expires_at > now())`,
      [req.userId, requested]
    );
    if (existing.length) return res.status(409).json({ error: 'You already have an active request for this item.', code: 'ACTIVE_REQUEST_EXISTS' });

    const cash = Number(b.cash_amount ?? b.premium_amount ?? 0);
    const { rows } = await pool.query(
      `INSERT INTO swap_requests(from_user_id, to_user_id, offered_product_id, requested_product_id, status, premium_amount, expires_at) VALUES($1, $2, $3, $4, 'pending', $5, now() + interval '48 hours') RETURNING id`,
      [req.userId, b.to_user_id, offered, requested, cash]
    );
    await pool.query(
      `INSERT INTO notifications(user_id, type, title, body, route) VALUES($1, 'swap_request', 'New SVAP Offer', 'You have received a new SVAP request.', '/requests')`,
      [b.to_user_id]
    );
    const { rows: full } = await pool.query(`SELECT ${SELECT} ${JOINS} WHERE sr.id = $1`, [rows[0].id]);
    res.status(201).json({ data: full[0] });
  } catch (e) {
    console.error('[pg create swap]', e.message);
    res.status(500).json({ error: 'Could not create request' });
  }
});

router.patch('/:id', requireAuth, async (req, res) => {
  const status = req.body.status;
  try {
    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Unsupported status' });
    }
    const { rows: found } = await pool.query('SELECT * FROM swap_requests WHERE id = $1', [req.params.id]);
    if (!found.length) return res.status(404).json({ error: 'Request not found' });

    const sr = found[0];
    if (status === 'cancelled') {
      if (req.userId !== sr.from_user_id && req.userId !== sr.to_user_id) return res.status(403).json({ error: 'Not a participant' });
      if (sr.status !== 'accepted') return res.status(409).json({ error: 'Only an accepted request can be cancelled' });
    } else {
      if (req.userId !== sr.to_user_id) return res.status(403).json({ error: 'Only receiver may accept or reject' });
      if (sr.status !== 'pending' || new Date(sr.expires_at) <= new Date()) return res.status(409).json({ error: 'Request expired or no longer pending' });
    }

    let hasCheckoutOrder = false;
    if (status === 'cancelled') {
      const { rows: orders } = await pool.query(
        'SELECT EXISTS(SELECT 1 FROM orders WHERE swap_request_id = $1) AS has_checkout',
        [sr.id]
      );
      hasCheckoutOrder = orders[0].has_checkout;
    }

    const { rows } = await pool.query(
      'UPDATE swap_requests SET status = $1 WHERE id = $2 AND status = $3 RETURNING *',
      [status, sr.id, sr.status]
    );
    if (!rows.length) return res.status(409).json({ error: 'Request changed; refresh and retry' });

    if (status === 'accepted') {
      await pool.query("UPDATE products SET status = 'in_swap' WHERE id = ANY($1)", [[sr.offered_product_id, sr.requested_product_id].filter(Boolean)]);
      await pool.query(
        `UPDATE profiles SET committed_swaps = COALESCE(committed_swaps, 0) + 1,
          swap_score = ROUND(LEAST(5::numeric, GREATEST(0::numeric,
            COALESCE(completed_swaps, 0)::numeric * 5 / NULLIF(COALESCE(committed_swaps, 0) + 1, 0)
          )), 1) WHERE id = ANY($1)`,
        [[sr.from_user_id, sr.to_user_id]]
      );
    }
    if (status === 'cancelled') {
      const { rows: checkoutRows } = await pool.query(
        'SELECT DISTINCT from_user_id FROM orders WHERE swap_request_id = $1 AND from_user_id = ANY($2)',
        [sr.id, [sr.from_user_id, sr.to_user_id]]
      );
      const checkoutUsers = checkoutRows.map((order) => order.from_user_id);
      const relievedUserId = checkoutUsers.length === 1 ? checkoutUsers[0]
        : checkoutUsers.length === 0 ? (req.userId === sr.from_user_id ? sr.to_user_id : sr.from_user_id) : null;
      if (relievedUserId) {
        await pool.query(
          `UPDATE profiles SET committed_swaps = GREATEST(COALESCE(committed_swaps, 0) - 1, 0),
            swap_score = ROUND(LEAST(5::numeric, GREATEST(0::numeric,
              COALESCE(completed_swaps, 0)::numeric * 5 /
              NULLIF(GREATEST(COALESCE(committed_swaps, 0) - 1, 0), 0)
            )), 1) WHERE id = $1`, [relievedUserId]
        );
      }
      await pool.query("UPDATE products SET status = 'active' WHERE id = ANY($1) AND status = 'in_swap'", [[sr.offered_product_id, sr.requested_product_id].filter(Boolean)]);
      await pool.query(
        `UPDATE orders SET status = 'cancelled', admin_notes = concat_ws(E'\\n', NULLIF(admin_notes, ''), $2) WHERE swap_request_id = $1 AND status <> 'cancelled'`,
        [sr.id, hasCheckoutOrder ? 'SVAP cancelled by a participant; support refund follow-up is required.' : 'SVAP cancelled by a participant.']
      );
    }

    if (status === 'rejected') {
      await pool.query(
        'INSERT INTO notifications(user_id, type, title, body, route) VALUES($1, $2, $3, $4, $5)',
        [sr.from_user_id, 'swap_rejected', 'Request Rejected', 'Your SVAP request has been rejected.', '/requests']
      );
    } else if (status === 'cancelled') {
      const { rows: checkoutRows } = await pool.query(
        'SELECT DISTINCT from_user_id FROM orders WHERE swap_request_id = $1',
        [sr.id]
      );
      const checkedOutUserIds = new Set(checkoutRows.map((order) => order.from_user_id));

      for (const participantId of [sr.from_user_id, sr.to_user_id]) {
        const hasOwnCheckout = checkedOutUserIds.has(participantId);
        const isCanceller = participantId === req.userId;
        let body = isCanceller
          ? 'You have cancelled this SVAP offer.'
          : 'Your SVAP request has been rejected.';
        if (hasOwnCheckout) body += ' You will be contacted by support team for refund.';
        await pool.query(
          'INSERT INTO notifications(user_id, type, title, body, route) VALUES($1, $2, $3, $4, $5)',
          [participantId, 'swap_cancelled', 'SVAP Cancelled', body, '/requests']
        );
      }
    } else {
      await pool.query(
        'INSERT INTO notifications(user_id, type, title, body, route) VALUES($1, $2, $3, $4, $5)',
        [sr.from_user_id, 'swap_accepted', 'SVAP accepted', 'Your SVAP request was accepted.', '/requests']
      );
    }

    const { rows: full } = await pool.query(`SELECT ${SELECT} ${JOINS} WHERE sr.id = $1`, [sr.id]);
    res.json({ data: full[0] });
  } catch (e) {
    console.error('[pg update swap]', e.message);
    res.status(500).json({ error: 'Could not update request' });
  }
});

module.exports = router;