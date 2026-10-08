const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const formatOrderNumber = require('../helpers/formatOrderNumber');

const router = express.Router();
const SELECT = `sr.*, jsonb_build_object('title', op.title, 'image_urls', op.image_urls) offered,
  jsonb_build_object('title', rp.title, 'image_urls', rp.image_urls) requested,
  jsonb_build_object('username', fu.username, 'avatar_url', fu.avatar_url) from_profile,
  jsonb_build_object('username', tu.username, 'avatar_url', tu.avatar_url) to_profile`;
const JOINS = `FROM swap_requests sr
  LEFT JOIN products op ON op.id = sr.offered_product_id
  LEFT JOIN products rp ON rp.id = sr.requested_product_id
  LEFT JOIN profiles fu ON fu.id = sr.from_user_id
  LEFT JOIN profiles tu ON tu.id = sr.to_user_id`;

function adaptSwap(row) {
  return { ...row, status: row.status === 'declined' ? 'rejected' : row.status };
}
async function getResponsibleParticipant(swap, cancellerId) {
  const { rows } = await pool.query(
    'SELECT DISTINCT from_user_id FROM orders WHERE swap_request_id=$1 AND from_user_id=ANY($2::uuid[])',
    [swap.id, [swap.from_user_id, swap.to_user_id]]
  );
  if (rows.length === 1) return rows[0].from_user_id === swap.from_user_id ? swap.to_user_id : swap.from_user_id;
  if (rows.length === 0) return swap.to_user_id;
  return cancellerId;
}
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    const { rows } = await pool.query(
      `SELECT ${SELECT} ${JOINS}
       WHERE (sr.from_user_id=$1 OR sr.to_user_id=$1)
         AND sr.status NOT IN ('declined','rejected','expired','unavailable')
       ORDER BY sr.created_at DESC`,
      [req.userId]
    );
    res.json({ data: rows.map(adaptSwap) });
  } catch (error) {
    console.error('[pg swaps]', error.message);
    res.status(500).json({ error: 'Could not load requests' });
  }
});

router.get('/check/:userId/:productId', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    const { rows } = await pool.query(
      `SELECT id,status,expires_at FROM swap_requests
       WHERE from_user_id=$1 AND requested_product_id=$2
         AND status IN ('pending','accepted')
         AND (status='accepted' OR expires_at>now())`,
      [req.userId, req.params.productId]
    );
    const active = rows.length > 0;
    res.json({ canSend: !active, nextAvailable: null, code: active ? 'ACTIVE_REQUEST_EXISTS' : null });
  } catch (error) {
    res.status(500).json({ error: 'Could not check request' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const body = req.body || {};
  const offered = body.offered_product_id || null;
  const requested = body.requested_product_id;
  try {
    if (!requested || !body.to_user_id || body.to_user_id === req.userId ||
        (!offered && Number(body.cash_amount ?? body.premium_amount) <= 0)) {
      return res.status(400).json({ error: 'Invalid swap request' });
    }
    const { rows: existing } = await pool.query(
      `SELECT id FROM swap_requests
       WHERE from_user_id=$1 AND requested_product_id=$2
         AND status IN ('pending','accepted') AND (status='accepted' OR expires_at>now())`,
      [req.userId, requested]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'You already have an active request for this item.', code: 'ACTIVE_REQUEST_EXISTS' });
    }
    const cash = Number(body.cash_amount ?? body.premium_amount ?? 0);
    const { rows } = await pool.query(
      `INSERT INTO swap_requests(
         from_user_id,to_user_id,offered_product_id,requested_product_id,status,premium_amount,expires_at
       ) VALUES($1,$2,$3,$4,'pending',$5,now()+interval '48 hours') RETURNING id`,
      [req.userId, body.to_user_id, offered, requested, cash]
    );
    await pool.query(
      `INSERT INTO notifications(user_id,type,title,body,route)
       VALUES($1,'swap_request','New SVAP Offer',$2,'/requests')`,
      [body.to_user_id, `You have received a new SVAP request. Order ID: ${formatOrderNumber(rows[0].id)}`]
    );
    const { rows: full } = await pool.query(`SELECT ${SELECT} ${JOINS} WHERE sr.id=$1`, [rows[0].id]);
    res.status(201).json({ data: adaptSwap(full[0]) });
  } catch (error) {
    console.error('[pg create swap]', error.message);
    res.status(500).json({ error: 'Could not create request' });
  }
});

router.patch('/:id', requireAuth, async (req, res) => {
  const status = req.body?.status;
  const dbStatus = status === 'rejected' ? 'declined' : status;
  try {
    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Unsupported status' });
    }
    const { rows: found } = await pool.query('SELECT * FROM swap_requests WHERE id=$1', [req.params.id]);
    if (!found.length) return res.status(404).json({ error: 'Request not found' });
    const swap = found[0];
    if (status === 'accepted') {
      if (req.userId !== swap.to_user_id) return res.status(403).json({ error: 'Only receiver may accept or reject' });
      if (swap.status !== 'pending' || new Date(swap.expires_at) <= new Date()) {
        return res.status(409).json({ error: 'Request expired or no longer pending' });
      }
      // Keep it pending until the receiver submits checkout; the order transaction accepts it.
      return res.json({ data: adaptSwap(swap), checkout_required: true });
    }
    if (status === 'cancelled') {
      if (req.userId !== swap.from_user_id && req.userId !== swap.to_user_id) {
        return res.status(403).json({ error: 'Not a participant' });
      }
      if (swap.status !== 'accepted') return res.status(409).json({ error: 'Only an accepted request can be cancelled' });
    } else {
      if (req.userId !== swap.to_user_id) return res.status(403).json({ error: 'Only receiver may accept or reject' });
      if (swap.status !== 'pending' || new Date(swap.expires_at) <= new Date()) {
        return res.status(409).json({ error: 'Request expired or no longer pending' });
      }
    }

    const responsibleId = status === 'cancelled' ? await getResponsibleParticipant(swap, req.userId) : null;
    const update = status === 'cancelled'
      ? await pool.query(
          'UPDATE swap_requests SET status=$1,cancelled_by_user_id=$2 WHERE id=$3 AND status=$4 RETURNING *', [dbStatus, responsibleId, swap.id, swap.status]
        )
      : await pool.query(
          'UPDATE swap_requests SET status=$1 WHERE id=$2 AND status=$3 RETURNING *',
          [dbStatus, swap.id, swap.status]
        );
    if (!update.rows.length) return res.status(409).json({ error: 'Request changed; refresh and retry' });

    if (status === 'rejected') {
      await pool.query(
        `UPDATE products SET status='active' WHERE id=ANY($1) AND status='in_swap'`,
        [[swap.offered_product_id, swap.requested_product_id].filter(Boolean)]
      );
      await pool.query(
        `INSERT INTO notifications(user_id,type,title,body,route)
         VALUES($1,'swap_rejected','Request Rejected',$2,'/requests')`,
        [swap.from_user_id, `Your SVAP request has been rejected. Order ID: ${formatOrderNumber(swap.id)}`]
      );
    } else {
      const { rows: orders } = await pool.query(
        'SELECT DISTINCT from_user_id FROM orders WHERE swap_request_id=$1', [swap.id]
      );
      const checkoutUsers = new Set(orders.map((order) => order.from_user_id));
      await pool.query(
        `UPDATE products SET status='active' WHERE id=ANY($1) AND status IN ('in_swap','swapped')`,
        [[swap.offered_product_id, swap.requested_product_id].filter(Boolean)]
      );
      await pool.query(
        `UPDATE orders SET status='cancelled', admin_notes=concat_ws(E'\n',NULLIF(admin_notes,''),$2)
         WHERE swap_request_id=$1 AND status<>'cancelled'`,
        [swap.id, checkoutUsers.size ? 'SVAP cancelled by a participant; support refund follow-up is required.' : 'SVAP cancelled by a participant.']
      );
      for (const participantId of [swap.from_user_id, swap.to_user_id]) {
        const isCanceller = participantId === req.userId;
        const body = (isCanceller ? 'You have cancelled this SVAP offer.' : 'Your SVAP request has been rejected.') +
          (checkoutUsers.has(participantId) ? ' You will be contacted by support team for refund.' : '') +
          ` Order ID: ${formatOrderNumber(swap.id)}`;
        await pool.query(
          'INSERT INTO notifications(user_id,type,title,body,route) VALUES($1,$2,$3,$4,$5)',
          [participantId, isCanceller ? 'swap_cancelled' : 'swap_rejected', isCanceller ? 'SVAP Cancelled' : 'Request Rejected', body, '/requests']
        );
      }
    }

    const { rows: full } = await pool.query(`SELECT ${SELECT} ${JOINS} WHERE sr.id=$1`, [swap.id]);
    res.json({ data: adaptSwap(full[0]) });
  } catch (error) {
    console.error('[pg update swap]', error.message);
    res.status(500).json({ error: 'Could not update request' });
  }
});
module.exports = router;
