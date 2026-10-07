const express = require('express');
const pool = require('../db');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const profiles = require('../controllers/pgProfileController');
const router = express.Router();
const profileJoin = `LEFT JOIN LATERAL (
  SELECT canonical.username, canonical.avatar_url, canonical.city, canonical.swap_score, canonical.reliability_score, canonical.total_swaps, canonical.committed_swaps, canonical.completed_swaps, canonical.is_verified
  FROM profiles owner
  JOIN profiles canonical ON (
    (NULLIF(BTRIM(owner.email), '') IS NOT NULL AND LOWER(BTRIM(canonical.email))=LOWER(BTRIM(owner.email)))
    OR (NULLIF(BTRIM(owner.email), '') IS NULL AND canonical.id=owner.id)
  )
  WHERE owner.id=p.user_id
  ORDER BY canonical.created_at DESC NULLS LAST, canonical.id DESC
  LIMIT 1
) pr ON TRUE`;
const productFields = `p.*, pr.username, pr.avatar_url, pr.city AS profile_city, pr.swap_score, pr.reliability_score, pr.total_swaps, pr.committed_swaps, pr.completed_swaps, pr.is_verified`;
function normalizeMediaUrl(value) {
  if (typeof value !== 'string') return value;
  const base = String(process.env.API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) return value;
  try {
    const parsed = new URL(value, base);
    if (parsed.pathname.startsWith('/uploads/')) {
      return `${base}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {}
  return value;
}

function adaptProduct(product) {
  const images = Array.isArray(product.image_urls) ? product.image_urls.map(normalizeMediaUrl) : [];
  return {
    ...product,
    image_urls: images,
    video_url: normalizeMediaUrl(product.video_url),
    city: product.area || null,
    thumbnail_url: normalizeMediaUrl(product.thumbnail_url || images[0] || null),
  };
}
const shape = (r) => { const { username, avatar_url, profile_city, swap_score, reliability_score, total_swaps, committed_swaps, completed_swaps, is_verified, ...p } = r; return { ...adaptProduct(p), profiles: { username, avatar_url, city: profile_city, swap_score, reliability_score, total_swaps, committed_swaps, completed_swaps, is_verified } }; };

router.get('/', optionalAuth, async (req, res) => {
  try {
    const values = ['active'];
    let where = 'p.status=$1';
    if (req.query.category && req.query.category !== 'All') {
      values.push('%' + req.query.category + '%');
      where += ' AND p.category ILIKE $' + values.length;
    }
    if (req.query.search) {
      values.push('%' + req.query.search + '%');
      const searchParam = '$' + values.length;
      where += ' AND (p.title ILIKE ' + searchParam + ' OR p.description ILIKE ' + searchParam + ' OR p.category ILIKE ' + searchParam + ')';
    }
    if (req.query.stories === 'true') {
      values.push(new Date(Date.now() - 7 * 86400000));
      where += ' AND p.created_at >= $' + values.length;
    }
    const orderBy = req.query.sort === 'low-high'
      ? 'p.estimated_value ASC NULLS LAST, p.created_at DESC'
      : req.query.sort === 'high-low'
        ? 'p.estimated_value DESC NULLS LAST, p.created_at DESC'
        : 'p.created_at DESC';
    const query = 'SELECT ' + productFields + ' FROM products p ' + profileJoin + ' WHERE ' + where + ' ORDER BY ' + orderBy;
    const { rows } = await pool.query(query, values);
    res.set('Cache-Control', 'no-store');
    res.json({ data: rows.map(shape) });
  } catch (error) {
    console.error('[pg products]', error.message);
    res.status(500).json({ error: 'Could not load listings' });
  }
});
router.get('/stories', async (req,res) => {
 try {
  const {rows}=await pool.query(`SELECT ${productFields} FROM products p ${profileJoin} WHERE p.status='active' AND p.created_at >= now()-interval '7 days' ORDER BY p.created_at DESC`);
  res.set("Cache-Control","no-store"); res.json({data:rows.map(shape)});
 } catch(e) { res.status(500).json({error:'Could not load listings'}); }
});router.get('/user/:userId', optionalAuth, async(req,res)=>{try{const vals=[req.params.userId,req.userId];let where="p.user_id=$1 AND (p.status <> 'in_swap' OR p.user_id=$2)";if(req.query.active==='true')where+=" AND p.status='active'";const {rows}=await pool.query(`SELECT ${productFields} FROM products p ${profileJoin} WHERE ${where} ORDER BY p.created_at DESC`,vals);res.set("Cache-Control","no-store"); res.json({data:rows.map(shape)});}catch(e){res.status(500).json({error:'Could not load listings'});}});
router.get('/:id/questions',async(req,res)=>{try{const {rows}=await pool.query(`SELECT q.*, jsonb_build_object('username',pr.username,'full_name',pr.full_name,'avatar_url',pr.avatar_url) AS profiles FROM product_questions q LEFT JOIN profiles pr ON pr.id=q.user_id WHERE q.product_id=$1 ORDER BY q.created_at ASC`,[req.params.id]);res.json({data:rows});}catch(e){res.status(500).json({error:'Could not load questions'});}});
router.post('/:id/questions',requireAuth,async(req,res)=>{try{const question=String(req.body.question||'').trim();if(!question||question.length>1000)return res.status(400).json({error:'A question up to 1000 characters is required'});const {rows:p}=await pool.query('SELECT id,user_id,title FROM products WHERE id=$1',[req.params.id]);if(!p.length)return res.status(404).json({error:'Product not found'});const {rows}=await pool.query('INSERT INTO product_questions(product_id,user_id,question) VALUES($1,$2,$3) RETURNING *',[req.params.id,req.userId,question]);if(p[0].user_id!==req.userId)await pool.query("INSERT INTO notifications(user_id,type,title,body,route) VALUES($1,'product_question','New question about your listing',$2,$3)",[p[0].user_id,`A user asked: ${question.slice(0,180)}`,`/product/${req.params.id}`]);res.status(201).json({data:rows[0]});}catch(e){console.error('[pg question]',e.message);res.status(500).json({error:'Could not post question'});}});
router.patch('/:id/questions/:questionId/answer',requireAuth,async(req,res)=>{try{const answer=String(req.body.answer||'').trim();if(!answer||answer.length>1000)return res.status(400).json({error:'An answer up to 1000 characters is required'});const {rows}=await pool.query(`UPDATE product_questions q SET answer=$1 FROM products p WHERE q.id=$2 AND q.product_id=$3 AND p.id=q.product_id AND p.user_id=$4 RETURNING q.*`,[answer,req.params.questionId,req.params.id,req.userId]);if(!rows.length)return res.status(404).json({error:'Question not found or unauthorized'});await pool.query("INSERT INTO notifications(user_id,type,title,body,route) VALUES($1,'product_answer','Your question was answered','The seller answered your question.', $2)",[rows[0].user_id,`/product/${req.params.id}`]);res.json({data:rows[0]});}catch(e){res.status(500).json({error:'Could not answer question'});}});
router.get('/:id',optionalAuth,async(req,res)=>{try{const {rows}=await pool.query(`SELECT ${productFields} FROM products p ${profileJoin} WHERE p.id=$1`,[req.params.id]);if(!rows.length)return res.status(404).json({error:'Product not found'});res.set("Cache-Control","no-store"); res.json({data:shape(rows[0])});}catch(e){res.status(500).json({error:'Could not load listing'});}});
router.post('/',requireAuth,async(req,res)=>{try{await profiles.ensureProfile(req.userId,req.authUser?.email,req.authUser?.user_metadata?.full_name||req.authUser?.user_metadata?.name,req.authUser?.user_metadata?.avatar_url||req.authUser?.user_metadata?.picture);const b=req.body||{};const required=['title','description','category','condition','swap_for'];if(required.some(k=>!String(b[k]||'').trim())||!Array.isArray(b.image_urls)||!b.image_urls.length||!Number.isSafeInteger(Number(b.estimated_value))||Number(b.estimated_value)<=0)return res.status(400).json({error:'Required listing fields are missing or invalid'});const {rows}=await pool.query(`INSERT INTO products(user_id,title,description,category,condition,swap_for,image_urls,video_url,estimated_value,area,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active') RETURNING *`,[req.userId,b.title,b.description,b.category,b.condition,b.swap_for,b.image_urls,b.video_url||null,Number(b.estimated_value),b.area||b.city||null]);res.status(201).json({success:true,data:adaptProduct(rows[0])});}catch(e){console.error('[pg create product]',e.message);res.status(500).json({error:'Could not create listing'});}});
router.put('/:id',requireAuth,async(req,res)=>{try{const input={...req.body};if(input.area===undefined&&input.city!==undefined)input.area=input.city;const allow=['title','description','category','condition','swap_for','image_urls','video_url','estimated_value','area'];const keys=allow.filter(k=>input[k]!==undefined);if(!keys.length)return res.status(400).json({error:'Nothing to update'});const vals=[req.params.id,req.userId,...keys.map(k=>input[k])];const set=keys.map((k,i)=>`${k}=$${i+3}`).join(',');const {rows}=await pool.query(`UPDATE products SET ${set} WHERE id=$1 AND user_id=$2 RETURNING *`,vals);if(!rows.length)return res.status(404).json({error:'Listing not found'});res.json({data:adaptProduct(rows[0])});}catch(e){res.status(500).json({error:'Could not update listing'});}});
router.delete('/:id',requireAuth,async(req,res)=>{try{const {rowCount}=await pool.query('DELETE FROM products WHERE id=$1 AND user_id=$2',[req.params.id,req.userId]);if(!rowCount)return res.status(404).json({error:'Listing not found'});res.json({success:true});}catch(e){res.status(500).json({error:'Could not delete listing'});}});
module.exports=router;


