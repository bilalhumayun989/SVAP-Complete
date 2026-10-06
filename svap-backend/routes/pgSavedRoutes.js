// const express=require('express');const pool=require('../db');const {requireAuth}=require('../middleware/auth');const router=express.Router();
// router.get('/:userId/ids',requireAuth,async(req,res)=>{try{if(req.params.userId!==req.userId)return res.status(403).json({error:'Forbidden'});const {rows}=await pool.query('SELECT product_id FROM saved_products WHERE user_id=$1',[req.userId]);res.json({data:rows.map(x=>x.product_id)});}catch(e){res.status(500).json({error:'Could not load saved items'});}});
// router.get('/:userId',requireAuth,async(req,res)=>{try{if(req.params.userId!==req.userId)return res.status(403).json({error:'Forbidden'});const {rows}=await pool.query(`SELECT sp.*, jsonb_build_object('id',p.id,'title',p.title,'image_urls',p.image_urls,'condition',p.condition,'swap_for',p.swap_for,'status',p.status,'profiles',jsonb_build_object('username',pr.username,'avatar_url',pr.avatar_url,'city',pr.city)) product FROM saved_products sp JOIN products p ON p.id=sp.product_id LEFT JOIN profiles pr ON pr.id=p.user_id WHERE sp.user_id=$1 AND p.status='active' ORDER BY sp.created_at DESC`,[req.userId]);res.json({data:rows});}catch(e){res.status(500).json({error:'Could not load saved items'});}});
// router.post('/',requireAuth,async(req,res)=>{try{const {product_id}=req.body;if(!product_id)return res.status(400).json({error:'product_id required'});const {rows}=await pool.query('INSERT INTO saved_products(user_id,product_id) VALUES($1,$2) ON CONFLICT(user_id,product_id) DO UPDATE SET product_id=EXCLUDED.product_id RETURNING *',[req.userId,product_id]);res.json({data:rows[0]});}catch(e){res.status(500).json({error:'Could not save listing'});}});
// router.delete('/',requireAuth,async(req,res)=>{try{const {product_id}=req.body;await pool.query('DELETE FROM saved_products WHERE user_id=$1 AND product_id=$2',[req.userId,product_id]);res.json({success:true});}catch(e){res.status(500).json({error:'Could not remove saved listing'});}});
// module.exports=router;


const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:userId/ids', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { rows } = await pool.query(
      'SELECT product_id FROM saved_products WHERE user_id=$1',
      [req.userId]
    );

    res.json({ data: rows.map((x) => x.product_id) });
  } catch (e) {
    res.status(500).json({ error: 'Could not load saved items' });
  }
});

router.get('/:userId', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { rows } = await pool.query(
      `SELECT sp.*, jsonb_build_object(
        'id', p.id,
        'title', p.title,
        'image_urls', p.image_urls,
        'condition', p.condition,
        'swap_for', p.swap_for,
        'status', p.status,
        'profiles', jsonb_build_object(
          'username', pr.username,
          'avatar_url', pr.avatar_url,
          'city', pr.city
        )
      ) product 
      FROM saved_products sp 
      JOIN products p ON p.id = sp.product_id 
      LEFT JOIN profiles pr ON pr.id = p.user_id 
      WHERE sp.user_id = $1 AND p.status = 'active' 
      ORDER BY sp.created_at DESC`,
      [req.userId]
    );

    res.json({ data: rows });
  } catch (e) {
    res.status(500).json({ error: 'Could not load saved items' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'product_id required' });
    }

    const { rows } = await pool.query(
      'INSERT INTO saved_products(user_id, product_id) VALUES($1, $2) ON CONFLICT(user_id, product_id) DO UPDATE SET product_id = EXCLUDED.product_id RETURNING *',
      [req.userId, product_id]
    );

    res.json({ data: rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Could not save listing' });
  }
});

router.delete('/', requireAuth, async (req, res) => {
  try {
    const { product_id } = req.body;

    await pool.query(
      'DELETE FROM saved_products WHERE user_id=$1 AND product_id=$2',
      [req.userId, product_id]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not remove saved listing' });
  }
});

module.exports = router;