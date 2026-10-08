const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const formatOrderNumber = require('../helpers/formatOrderNumber');
const router = express.Router();
router.use(requireAuth, requireAdmin);
async function cancelSwap(client, swapId, explicitResponsibleId = null) {
  const { rows: found } = await client.query(
    'SELECT from_user_id,to_user_id FROM swap_requests WHERE id=$1 FOR UPDATE', [swapId]
  );
  if (!found.length) return null;
  const [fromUserId, toUserId] = [found[0].from_user_id, found[0].to_user_id];
  let responsibleId = explicitResponsibleId;
  if (!responsibleId) {
    const { rows: checkedOut } = await client.query(
      'SELECT DISTINCT from_user_id FROM orders WHERE swap_request_id=$1 AND from_user_id=ANY($2::uuid[])',
      [swapId, [fromUserId, toUserId]]
    );
    if (checkedOut.length === 1) responsibleId = checkedOut[0].from_user_id === fromUserId ? toUserId : fromUserId;
    else if (checkedOut.length === 0) responsibleId = toUserId;
  }
  const { rows } = await client.query(
    `UPDATE swap_requests SET status='cancelled',cancelled_by_user_id=$2
     WHERE id=$1 AND status NOT IN ('completed','cancelled')
     RETURNING offered_product_id,requested_product_id,from_user_id,to_user_id`,
    [swapId, responsibleId]
  );
  return rows[0] || null;
}
const swapSelect = `SELECT sr.id, sr.status, sr.created_at, sr.premium_amount, sr.from_user_id, sr.to_user_id,
 jsonb_build_object('id',sp.id,'username',sp.username,'full_name',sp.full_name,'email',sp.email,'phone',sp.phone) AS sender,
 jsonb_build_object('id',rp.id,'username',rp.username,'full_name',rp.full_name,'email',rp.email,'phone',rp.phone) AS receiver,
 CASE WHEN op.id IS NULL THEN NULL ELSE jsonb_build_object('id',op.id,'title',op.title,'image_urls',op.image_urls) END AS offered_product,
 CASE WHEN rq.id IS NULL THEN NULL ELSE jsonb_build_object('id',rq.id,'title',rq.title,'image_urls',rq.image_urls) END AS requested_product
 FROM swap_requests sr LEFT JOIN profiles sp ON sp.id=sr.from_user_id LEFT JOIN profiles rp ON rp.id=sr.to_user_id
 LEFT JOIN products op ON op.id=sr.offered_product_id LEFT JOIN products rq ON rq.id=sr.requested_product_id`;
const mapSwap = (s, orders) => ({ swapId:s.id, swapStatus:s.status||'pending', createdAt:s.created_at,
 premiumAmount:Number(s.premium_amount||0), sender:s.sender, receiver:s.receiver,
 offeredProduct:s.offered_product, requestedProduct:s.requested_product,
 party1Order:orders.find(o=>o.from_user_id===s.from_user_id)||null,
 party2Order:orders.find(o=>o.from_user_id===s.to_user_id)||null });

router.get('/access', (_req,res) => res.json({ data:{is_admin:true} }));
router.get('/swaps', async (_req,res) => {
  try {
    const {rows:swaps}=await pool.query(`${swapSelect} WHERE EXISTS(SELECT 1 FROM orders o WHERE o.swap_request_id=sr.id) ORDER BY sr.created_at DESC`);
    const ids=swaps.map(s=>s.id);
    const orders=ids.length?(await pool.query('SELECT * FROM orders WHERE swap_request_id=ANY($1::uuid[]) ORDER BY created_at',[ids])).rows:[];
    const grouped=new Map(); for(const o of orders){const list=grouped.get(o.swap_request_id)||[];list.push(o);grouped.set(o.swap_request_id,list);}
    res.set('Cache-Control','no-store'); res.json({data:swaps.map(s=>mapSwap(s,grouped.get(s.id)||[]))});
  } catch(e){console.error('[admin swaps]',e.message);res.status(500).json({error:'Could not load swap orders'});}
});
router.get('/swaps/:id', async (req,res) => {
  try { const {rows}=await pool.query(`${swapSelect} WHERE sr.id=$1`,[req.params.id]); if(!rows.length)return res.status(404).json({error:'Swap not found'});
    const {rows:orders}=await pool.query('SELECT * FROM orders WHERE swap_request_id=$1 ORDER BY created_at',[req.params.id]);
    res.set('Cache-Control','no-store');res.json({data:{...rows[0],orders}});
  } catch(e){console.error('[admin swap detail]',e.message);res.status(500).json({error:'Could not load swap'});}
});

router.get('/orders/:id',async(req,res)=>{try{const {rows}=await pool.query('SELECT id,swap_request_id FROM orders WHERE id=$1',[req.params.id]);if(!rows.length)return res.status(404).json({error:'Order not found'});res.json({data:rows[0]});}catch(e){console.error('[admin order redirect lookup]',e.message);res.status(500).json({error:'Could not load order'});}});router.post('/orders/:id/actions', async (req,res) => {
 const client=await pool.connect(); const action=String(req.body?.action||'');
 try {
  await client.query('BEGIN');
  const {rows}=await client.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[req.params.id]);
  if(!rows.length){await client.query('ROLLBACK');return res.status(404).json({error:'Order not found'});}
  const o=rows[0]; let status=o.status, fields={}, title='', body='', relatedOrder=null;
  switch(action){
   case 'approve_payment': if(status!=='payment_verification')break; status='product_verification'; title='Payment Verified';body='Your payment has been verified. We are now checking your item before dispatch.';break;
   case 'reject_payment': if(status!=='payment_verification')break; status='cancelled';title='Payment Rejected';body='Your payment could not be verified.';break;
   case 'verify_product': if(status!=='product_verification')break;status='item_verification';title='Product Verified';body='Your product has been verified. We are now performing a final item check before shipping.';break;
   case 'fail_product': if(status!=='product_verification')break;status='cancelled';title='Item Verification Failed';body='Your item did not pass verification. Your order has been cancelled. ';break;
   case 'undo_payment': if(status!=='product_verification')break;status='payment_verification';title='Payment Review Reopened';body='Your payment is pending review again.';break;
   case 'undo_product': if(status!=='item_verification')break;status='product_verification';title='Item Review Reopened';body='Your item is pending verification again.';break;
   case 'assign_delivery': if(status!=='item_verification'||!['courier','self'].includes(req.body?.delivery_type)){await client.query('ROLLBACK');return res.status(400).json({error:'Choose courier or self delivery after item verification'});} fields.delivery_type=req.body.delivery_type;break;
   case 'mark_shipped': if(status!=='item_verification'||!o.delivery_type)break;status='shipped';fields.tracking_number=String(req.body?.tracking_number||'').trim()||null;title='Order Shipped';body=`Your order has been shipped via ${o.delivery_type==='self'?'SVAP delivery':'courier'}.${fields.tracking_number?` Tracking: ${fields.tracking_number}`:''}`;break;
   case 'mark_delivered': if(status!=='shipped')break;status='delivered';title='Order Delivered';body='Your item has been delivered. Enjoy your SVAP!';break;
   case 'save_note': fields.admin_notes=String(req.body?.note||'').trim()||null;break;
   case 'cancel': if(['cancelled','delivered'].includes(status))break;status='cancelled';title='Order Cancelled';body=o.transaction_ref?'Your order was cancelled.You’ll be contacted by support team for refund':'Your order was cancelled and this SVAP will not proceed.';break;
   default: await client.query('ROLLBACK');return res.status(400).json({error:'Unknown order action'});
  }
  if(status===o.status&&!Object.keys(fields).length){await client.query('ROLLBACK');return res.status(409).json({error:'This action is not valid for the current order status'});}
  if(status!==o.status)fields.status=status;
  const keys=Object.keys(fields);const values=[o.id,...keys.map(k=>fields[k])];
  const {rows:updated}=await client.query(`UPDATE orders SET ${keys.map((k,i)=>`${k}=$${i+2}`).join(',')} WHERE id=$1 RETURNING *`,values);
  if(action==='cancel'){
    await client.query("UPDATE orders SET status='cancelled' WHERE swap_request_id=$1 AND status NOT IN ('cancelled','delivered')",[o.swap_request_id]);
    const swap=await cancelSwap(client,o.swap_request_id);
    if(swap)await client.query("UPDATE products SET status='active' WHERE id=ANY($1::uuid[]) AND status='in_swap'",[[swap.offered_product_id,swap.requested_product_id].filter(Boolean)]);
  } else if(action==='reject_payment'||action==='fail_product'){
    const {rows:related}=await client.query(
      'SELECT * FROM orders WHERE swap_request_id=$1 AND id<>$2 ORDER BY created_at LIMIT 1 FOR UPDATE',
      [o.swap_request_id,o.id]
    );
    relatedOrder=related[0]||null;
    if(relatedOrder && relatedOrder.status!=='delivered'){
      await client.query("UPDATE orders SET status='cancelled' WHERE id=$1 AND status<>'cancelled'",[relatedOrder.id]);
    }
    const swap=await cancelSwap(client,o.swap_request_id,o.from_user_id);
    if(swap)await client.query("UPDATE products SET status='active' WHERE id=ANY($1::uuid[]) AND status='in_swap'",[[swap.offered_product_id,swap.requested_product_id].filter(Boolean)]);
  }
  if(action==='mark_delivered'){
    const {rows:remaining}=await client.query("SELECT id FROM orders WHERE swap_request_id=$1 AND status<>'delivered'",[o.swap_request_id]);
    const {rows:all}=await client.query('SELECT COUNT(*)::int total FROM orders WHERE swap_request_id=$1',[o.swap_request_id]);
    if(all[0].total>=2&&!remaining.length){const {rows:completedSwap}=await client.query("UPDATE swap_requests SET status='completed' WHERE id=$1 AND status<>'completed' RETURNING from_user_id,to_user_id",[o.swap_request_id]);if(completedSwap.length)await client.query('UPDATE profiles SET total_swaps=COALESCE(total_swaps,0)+1 WHERE id=ANY($1::uuid[])',[[completedSwap[0].from_user_id,completedSwap[0].to_user_id]]);const {rows:s}=await client.query('SELECT offered_product_id,requested_product_id FROM swap_requests WHERE id=$1',[o.swap_request_id]);if(s.length)await client.query("UPDATE products SET status='swapped' WHERE id=ANY($1::uuid[])",[[s[0].offered_product_id,s[0].requested_product_id].filter(Boolean)]);}
  }
  if(title){
    const orderId=formatOrderNumber(o);
    let ownBody=body;
    if(action==='reject_payment')ownBody+=' If payment was deducted, support will contact you about a refund.';
    if(action==='fail_product')ownBody+=' Your payment was verified; support will contact you about your refund.';
    await client.query("INSERT INTO notifications(user_id,type,title,body,route) VALUES($1,'order_status',$2,$3,'/orders')",[o.from_user_id,title,`${ownBody} Order ID: ${orderId}`]);
    if(relatedOrder){
      const paidStatuses=['product_verification','item_verification','shipped','delivered'];
      const itemPassedStatuses=['item_verification','shipped','delivered'];
      const partnerPaid=paidStatuses.includes(relatedOrder.status);
      let partnerBody=`Your SVAP partner's order status is now cancelled.`;
      let partnerTitle='SVAP Partner Update';
      if(action==='reject_payment'&&partnerPaid){
        partnerTitle='SVAP Cancelled - Refund Follow-up';
        partnerBody=`Your payment was verified, but your SVAP partner's payment could not be verified. Support will contact you to arrange your refund.`;
      } else if(action==='fail_product'&&partnerPaid){
        partnerTitle='SVAP Cancelled - Refund Follow-up';
        partnerBody=itemPassedStatuses.includes(relatedOrder.status)
          ? `Your payment was verified and your item passed inspection, but your SVAP partner's item failed inspection. Support will contact you to arrange your refund.`
          : `Your payment was verified, but your SVAP partner's item failed inspection. Support will contact you to arrange your refund.`;
      }
      await client.query("INSERT INTO notifications(user_id,type,title,body,route) VALUES($1,'order_status',$2,$3,'/orders')",[relatedOrder.from_user_id,partnerTitle,`${partnerBody} Order ID: ${orderId}`]);
    } else {
      const {rows:partner}=await client.query('SELECT from_user_id FROM orders WHERE swap_request_id=$1 AND id<>$2 LIMIT 1',[o.swap_request_id,o.id]);
      if(partner.length)await client.query("INSERT INTO notifications(user_id,type,title,body,route) VALUES($1,'order_status','SVAP Partner Update',$2,'/orders')",[partner[0].from_user_id,`Your SVAP partner's order status is now ${status}. Order ID: ${orderId}`]);
    }
  }
  await client.query('COMMIT');res.json({data:updated[0]});
 } catch(e){await client.query('ROLLBACK');console.error('[admin order action]',e.message);res.status(500).json({error:'Could not update order'});} finally{client.release();}
});
router.get('/dashboard', async (_req,res) => {
 try { const [pending,delivered,total,users,active,swapped,recent]=await Promise.all([
  pool.query("SELECT COUNT(*)::int count FROM orders WHERE status IN ('payment_verification','product_verification','item_verification')"),pool.query("SELECT COUNT(*)::int count FROM orders WHERE status='delivered'"),pool.query('SELECT COUNT(*)::int count FROM orders'),pool.query('SELECT COUNT(*)::int count FROM profiles'),pool.query("SELECT COUNT(*)::int count FROM products WHERE status='active'"),pool.query("SELECT COUNT(*)::int count FROM products WHERE status='swapped'"),pool.query("SELECT o.id,o.swap_request_id,o.delivery_name,o.delivery_city,o.total,o.status,o.created_at,jsonb_build_object('full_name',p.full_name) AS from_profile FROM orders o LEFT JOIN profiles p ON p.id=o.from_user_id ORDER BY o.created_at DESC LIMIT 6")
 ]);res.set('Cache-Control','no-store');res.json({data:{pendingVerification:pending.rows[0].count,deliveredOrders:delivered.rows[0].count,totalOrders:total.rows[0].count,totalUsers:users.rows[0].count,activeProducts:active.rows[0].count,swappedProducts:swapped.rows[0].count,recentOrders:recent.rows}}); }catch(e){console.error('[admin dashboard]',e.message);res.status(500).json({error:'Could not load dashboard'});}
});
router.get('/products',async(_req,res)=>{try{const {rows}=await pool.query('SELECT p.id,p.title,p.condition,p.image_urls,p.status,p.created_at,p.user_id AS owner_id,jsonb_build_object(\'username\',u.username,\'full_name\',u.full_name) AS owner FROM products p LEFT JOIN profiles u ON u.id=p.user_id ORDER BY p.created_at DESC');res.json({data:rows});}catch(e){console.error('[admin products]',e.message);res.status(500).json({error:'Could not load products'});}});
router.patch('/products/:id',async(req,res)=>{if(req.body?.status!=='removed')return res.status(400).json({error:'Only product removal is supported'});try{const {rows}=await pool.query("UPDATE products SET status='removed' WHERE id=$1 RETURNING id,status",[req.params.id]);if(!rows.length)return res.status(404).json({error:'Product not found'});res.json({data:rows[0]});}catch(e){console.error('[admin remove product]',e.message);res.status(500).json({error:'Could not remove product'});}});
router.get('/users',async(_req,res)=>{try{const {rows}=await pool.query('SELECT p.id,p.username,p.full_name,p.email,p.phone,p.city,p.avatar_url,p.created_at,(SELECT COUNT(*)::int FROM products x WHERE x.user_id=p.id) AS product_count FROM profiles p ORDER BY p.created_at DESC');res.json({data:rows});}catch(e){console.error('[admin users]',e.message);res.status(500).json({error:'Could not load users'});}});
async function getSupportTicketColumns() {
  const { rows } = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='support_tickets'"
  );
  return new Set(rows.map((row) => row.column_name));
}

router.get('/support', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.id,t.user_id,t.subject,t.message,t.status,
        to_jsonb(t)->>'admin_reply' AS admin_reply,
        to_jsonb(t)->>'created_at' AS created_at,
        to_jsonb(t)->>'replied_at' AS replied_at,
        to_jsonb(t)->>'closed_at' AS closed_at,
        to_jsonb(t)->>'resolution_note' AS resolution_note,
        jsonb_build_object('username',p.username,'full_name',p.full_name,'email',p.email) AS profile
      FROM support_tickets t
      LEFT JOIN profiles p ON p.id=t.user_id
      ORDER BY to_jsonb(t)->>'created_at' DESC NULLS LAST
    `);
    res.json({ data: rows });
  } catch (e) {
    console.error('[admin support]', e.message);
    res.status(500).json({ error: 'Could not load support tickets' });
  }
});

router.patch('/support/:id/reply', async (req, res) => {
  const reply = String(req.body?.admin_reply || '').trim();
  if (!reply) return res.status(400).json({ error: 'Reply is required' });
  try {
    const columns = await getSupportTicketColumns();
    if (!columns.has('admin_reply')) return res.status(500).json({ error: 'Support replies are not enabled in this database schema' });
    const set = ["admin_reply=$1", "status='replied'"];
    if (columns.has('replied_at')) set.push('replied_at=now()');
    const { rows } = await pool.query(
      `UPDATE support_tickets SET ${set.join(',')} WHERE id=$2 RETURNING *`,
      [reply, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Ticket not found' });
    await pool.query(
      "INSERT INTO notifications(user_id,type,title,body,route) VALUES($1,'support','Support Reply',$2,'/support')",
      [rows[0].user_id, `Admin replied to your support ticket: ${rows[0].subject}`]
    );
    res.json({ data: rows[0] });
  } catch (e) {
    console.error('[admin support reply]', e.message);
    res.status(500).json({ error: 'Could not reply to ticket' });
  }
});

router.patch('/support/:id/close', async (req, res) => {
  const note = String(req.body?.resolution_note || '').trim();
  try {
    const columns = await getSupportTicketColumns();
    const set = ["status='closed'"];
    const values = [];
    if (columns.has('closed_at')) set.push('closed_at=now()');
    if (columns.has('resolution_note')) {
      values.push(note || null);
      set.push(`resolution_note=$${values.length}`);
    }
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE support_tickets SET ${set.join(',')} WHERE id=$${values.length} RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'Ticket not found' });
    await pool.query(
      "INSERT INTO notifications(user_id,type,title,body,route) VALUES($1,'support','Support Ticket Closed',$2,'/support')",
      [rows[0].user_id, `Your support ticket \"${rows[0].subject}\" has been closed.`]
    );
    res.json({ data: rows[0] });
  } catch (e) {
    console.error('[admin support close]', e.message);
    res.status(500).json({ error: 'Could not close ticket' });
  }
});

router.patch('/support/:id/reopen', async (req, res) => {
  try {
    const columns = await getSupportTicketColumns();
    const set = ["status='open'"];
    if (columns.has('closed_at')) set.push('closed_at=NULL');
    if (columns.has('resolution_note')) set.push('resolution_note=NULL');
    const { rows } = await pool.query(
      `UPDATE support_tickets SET ${set.join(',')} WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ data: rows[0] });
  } catch (e) {
    console.error('[admin support reopen]', e.message);
    res.status(500).json({ error: 'Could not reopen ticket' });
  }
});

module.exports=router;