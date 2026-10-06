// const express=require('express');const pool=require('../db');const {requireAuth}=require('../middleware/auth');const router=express.Router();
// const STANDARD=479,CASH_ONLY_DELIVERY=300,FEE_RATE=.08;
// router.get('/',requireAuth,async(req,res)=>{try{const {rows}=await pool.query('SELECT * FROM orders WHERE from_user_id=$1 OR to_user_id=$1 ORDER BY created_at DESC',[req.userId]);const own=new Set(rows.filter(o=>o.from_user_id===req.userId).map(o=>o.swap_request_id));const {rows:swaps}=await pool.query("SELECT id,from_user_id,to_user_id,status,created_at FROM swap_requests WHERE (from_user_id=$1 OR to_user_id=$1) AND status IN ('accepted','completed') ORDER BY created_at DESC",[req.userId]);const pending=swaps.filter(s=>!own.has(s.id)).map(s=>({id:`checkout-${s.id}`,swap_request_id:s.id,from_user_id:s.from_user_id,to_user_id:s.to_user_id,delivery_name:'Checkout pending',delivery_phone:'',delivery_address:'Complete checkout from Requests',delivery_city:'',payment_method:'Awaiting checkout',shipping_cost:0,discount:0,total:0,status:'pending',created_at:s.created_at,is_checkout_pending:true}));res.json([...rows,...pending]);}catch(e){console.error('[pg get orders]',e.message);res.status(500).json({error:'Could not load orders'});}});
// router.post('/',requireAuth,async(req,res)=>{const b=req.body||{},uid=req.userId;const client=await pool.connect();try{await client.query('BEGIN');if(!b.swap_request_id)return res.status(400).json({error:'swap_request_id required'});const {rows:r}=await client.query('SELECT * FROM swap_requests WHERE id=$1 FOR UPDATE',[b.swap_request_id]);if(!r.length||!['accepted','completed'].includes(r[0].status)||new Date(r[0].expires_at)<=new Date()){await client.query('ROLLBACK');return res.status(409).json({error:'Swap is expired or unavailable'});}const sr=r[0];if(uid!==sr.from_user_id&&uid!==sr.to_user_id){await client.query('ROLLBACK');return res.status(403).json({error:'Not a swap participant'});}const old=await client.query('SELECT id FROM orders WHERE swap_request_id=$1 AND from_user_id=$2',[b.swap_request_id,uid]);if(old.rows.length){await client.query('ROLLBACK');return res.status(409).json({error:'Checkout already submitted'});}const amount=Number(sr.premium_amount||0),onlyCash=!sr.offered_product_id,cashPayer=uid===sr.from_user_id,fee=!cashPayer?Math.round(amount*FEE_RATE):0;const shipping=onlyCash?(cashPayer?CASH_ONLY_DELIVERY:fee?0:STANDARD):(fee?0:STANDARD);const total=onlyCash?(cashPayer?amount+CASH_ONLY_DELIVERY:fee||STANDARD):(cashPayer?STANDARD+amount:fee||STANDARD);const partner=uid===sr.from_user_id?sr.to_user_id:sr.from_user_id;const {rows}=await client.query(`INSERT INTO orders(swap_request_id,from_user_id,to_user_id,delivery_name,delivery_phone,delivery_address,delivery_city,payment_method,shipping_cost,discount,total,status,premium_amount,transaction_ref,tracking_number) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'payment_verification',$12,$13,$14) RETURNING *`,[b.swap_request_id,uid,partner,b.delivery_name||'',b.delivery_phone||'',b.delivery_address||'',b.delivery_city||'',b.payment_method||'bank_transfer',shipping,Number(b.discount||0),total,amount,b.transaction_ref||null,b.tracking_number||null]);await client.query("INSERT INTO notifications(user_id,type,title,body,route) VALUES($1,'order_update','Checkout submitted',$2,'/orders')",[partner,`Your SVAP partner submitted checkout. Order ID: ${rows[0].id}`]);await client.query('COMMIT');res.status(201).json(rows[0]);}catch(e){await client.query('ROLLBACK');console.error('[pg create order]',e.message);res.status(500).json({error:'Could not create order'});}finally{client.release();}});
// router.patch('/:id',requireAuth,async(req,res)=>{const status=req.body.status;const allowed=['payment_verification','product_verification','item_verification','shipped','delivered','cancelled'];if(!allowed.includes(status))return res.status(400).json({error:'Unsupported order status'});try{const {rows:admins}=await pool.query('SELECT is_admin FROM profiles WHERE id=$1',[req.userId]);if(!admins[0]?.is_admin)return res.status(403).json({error:'Admin access required'});const client=await pool.connect();try{await client.query('BEGIN');const {rows}=await client.query('UPDATE orders SET status=$1 WHERE id=$2 RETURNING *',[status,req.params.id]);if(!rows.length){await client.query('ROLLBACK');return res.status(404).json({error:'Order not found'});}const order=rows[0];const {rows:notes}=await client.query(`INSERT INTO notifications(user_id,type,title,body,route) VALUES($1,'order_status','Order status updated',$2,'/orders'),($3,'order_status','Order status updated',$2,'/orders') RETURNING id`,[order.from_user_id,`Your order status is now ${status}. Order ID: ${order.id}`,order.to_user_id]);if(status==='delivered'){const {rows:summary}=await client.query(`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE status='delivered')::int delivered FROM orders WHERE swap_request_id=$1`,[order.swap_request_id]);if(summary[0].total>=2&&summary[0].total===summary[0].delivered){const {rows:swap}=await client.query(`UPDATE swap_requests SET status='completed' WHERE id=$1 AND status<>'completed' RETURNING offered_product_id,requested_product_id,from_user_id,to_user_id`,[order.swap_request_id]);if(swap.length){await client.query("UPDATE products SET status='swapped' WHERE id=ANY($1)",[[swap[0].offered_product_id,swap[0].requested_product_id].filter(Boolean)]);await client.query('UPDATE profiles SET completed_swaps=completed_swaps+1 WHERE id=ANY($1)',[[swap[0].from_user_id,swap[0].to_user_id]]);}}}await client.query('COMMIT');res.json({data:order,notifications:notes.map(n=>n.id)});}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}catch(e){console.error('[pg admin order update]',e.message);res.status(500).json({error:'Could not update order'});}});
// module.exports=router;


const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const STANDARD = 479;
const CASH_ONLY_DELIVERY = 300;
const FEE_RATE = 0.08;

router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE from_user_id=$1 OR to_user_id=$1 ORDER BY created_at DESC',
      [req.userId]
    );

    const own = new Set(
      rows
        .filter((o) => o.from_user_id === req.userId)
        .map((o) => o.swap_request_id)
    );

    const { rows: swaps } = await pool.query(
      "SELECT id, from_user_id, to_user_id, status, created_at FROM swap_requests WHERE (from_user_id=$1 OR to_user_id=$1) AND status IN ('accepted','completed') ORDER BY created_at DESC",
      [req.userId]
    );

    const pending = swaps
      .filter((s) => !own.has(s.id))
      .map((s) => ({
        id: `checkout-${s.id}`,
        swap_request_id: s.id,
        from_user_id: s.from_user_id,
        to_user_id: s.to_user_id,
        delivery_name: 'Checkout pending',
        delivery_phone: '',
        delivery_address: 'Complete checkout from Requests',
        delivery_city: '',
        payment_method: 'Awaiting checkout',
        shipping_cost: 0,
        discount: 0,
        total: 0,
        status: 'pending',
        created_at: s.created_at,
        is_checkout_pending: true,
      }));

    res.json([...rows, ...pending]);
  } catch (e) {
    console.error('[pg get orders]', e.message);
    res.status(500).json({ error: 'Could not load orders' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  const uid = req.userId;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (!b.swap_request_id) {
      return res.status(400).json({ error: 'swap_request_id required' });
    }

    const { rows: r } = await client.query(
      'SELECT * FROM swap_requests WHERE id=$1 FOR UPDATE',
      [b.swap_request_id]
    );

    if (
      !r.length ||
      !['accepted', 'completed'].includes(r[0].status) ||
      new Date(r[0].expires_at) <= new Date()
    ) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Swap is expired or unavailable' });
    }

    const sr = r[0];

    if (uid !== sr.from_user_id && uid !== sr.to_user_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not a swap participant' });
    }

    const old = await client.query(
      'SELECT id FROM orders WHERE swap_request_id=$1 AND from_user_id=$2',
      [b.swap_request_id, uid]
    );

    if (old.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Checkout already submitted' });
    }

    const amount = Number(sr.premium_amount || 0);
    const onlyCash = !sr.offered_product_id;
    const cashPayer = uid === sr.from_user_id;
    // Only the acceptor of a cash-only offer pays the 8% platform fee.
    const fee = onlyCash && !cashPayer ? Math.round(amount * FEE_RATE) : 0;

    const shipping = onlyCash && cashPayer ? CASH_ONLY_DELIVERY : onlyCash ? 0 : STANDARD;

    const total = onlyCash
      ? cashPayer
        ? amount + CASH_ONLY_DELIVERY
        : fee || STANDARD
      : cashPayer
      ? STANDARD + amount
      : STANDARD;

    const partner = uid === sr.from_user_id ? sr.to_user_id : sr.from_user_id;

    const { rows } = await client.query(
      `INSERT INTO orders(
        swap_request_id, from_user_id, to_user_id, delivery_name, delivery_phone,
        delivery_address, delivery_city, payment_method, shipping_cost, discount,
        total, status, premium_amount, transaction_ref, tracking_number
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'payment_verification', $12, $13, $14) RETURNING *`,
      [
        b.swap_request_id,
        uid,
        partner,
        b.delivery_name || '',
        b.delivery_phone || '',
        b.delivery_address || '',
        b.delivery_city || '',
        b.payment_method || 'bank_transfer',
        shipping,
        Number(b.discount || 0),
        total,
        amount,
        b.transaction_ref || null,
        b.tracking_number || null,
      ]
    );

    await client.query(
      "INSERT INTO notifications(user_id, type, title, body, route) VALUES($1, 'order_update', 'Checkout submitted', $2, '/orders')",
      [partner, `Your SVAP partner submitted checkout. Order ID: ${rows[0].id}`]
    );

    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[pg create order]', e.message);
    res.status(500).json({ error: 'Could not create order' });
  } finally {
    client.release();
  }
});

router.patch('/:id', requireAuth, async (req, res) => {
  const status = req.body.status;
  const allowed = [
    'payment_verification',
    'product_verification',
    'item_verification',
    'shipped',
    'delivered',
    'cancelled',
  ];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Unsupported order status' });
  }

  try {
    const { rows: admins } = await pool.query(
      'SELECT is_admin FROM profiles WHERE id=$1',
      [req.userId]
    );

    if (!admins[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        'UPDATE orders SET status=$1 WHERE id=$2 RETURNING *',
        [status, req.params.id]
      );

      if (!rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = rows[0];

      const { rows: notes } = await client.query(
        `INSERT INTO notifications(user_id, type, title, body, route) 
         VALUES($1, 'order_status', 'Order status updated', $2, '/orders'),
               ($3, 'order_status', 'Order status updated', $2, '/orders') RETURNING id`,
        [
          order.from_user_id,
          `Your order status is now ${status}. Order ID: ${order.id}`,
          order.to_user_id,
        ]
      );

      if (status === 'delivered') {
        const { rows: summary } = await client.query(
          `SELECT COUNT(*)::int total, COUNT(*) FILTER(WHERE status='delivered')::int delivered 
           FROM orders WHERE swap_request_id=$1`,
          [order.swap_request_id]
        );

        if (summary[0].total >= 2 && summary[0].total === summary[0].delivered) {
          const { rows: swap } = await client.query(
            `UPDATE swap_requests SET status='completed' WHERE id=$1 AND status<>'completed' 
             RETURNING offered_product_id, requested_product_id, from_user_id, to_user_id`,
            [order.swap_request_id]
          );

          if (swap.length) {
            await client.query(
              "UPDATE products SET status='swapped' WHERE id=ANY($1)",
              [[swap[0].offered_product_id, swap[0].requested_product_id].filter(Boolean)]
            );
            await client.query(
              `UPDATE profiles
               SET completed_swaps = COALESCE(completed_swaps, 0) + 1,
                   swap_score = ROUND(LEAST(5::numeric, GREATEST(0::numeric,
                     COALESCE((COALESCE(completed_swaps, 0) + 1)::numeric * 5 /
                       NULLIF(COALESCE(committed_swaps, 0), 0), 0::numeric)
                   )), 1)
               WHERE id = ANY($1)`,
              [[swap[0].from_user_id, swap[0].to_user_id]]
            );
          }
        }
      }

      await client.query('COMMIT');
      res.json({ data: order, notifications: notes.map((n) => n.id) });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('[pg admin order update]', e.message);
    res.status(500).json({ error: 'Could not update order' });
  }
});

module.exports = router;