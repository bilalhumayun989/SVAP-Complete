// const express=require('express');const pool=require('../db');const {requireAuth}=require('../middleware/auth');const router=express.Router();
// router.get('/user/:userId/unread-count',requireAuth,async(req,res)=>{try{if(req.params.userId!==req.userId)return res.status(403).json({error:'Forbidden'});const {rows}=await pool.query('SELECT count(*)::int AS count FROM notifications WHERE user_id=$1 AND is_read=false',[req.userId]);res.json({count:rows[0]?.count||0});}catch(e){res.status(500).json({error:'Could not load unread notification count'});}});
// router.get('/user/:userId',requireAuth,async(req,res)=>{try{if(req.params.userId!==req.userId)return res.status(403).json({error:'Forbidden'});const {rows}=await pool.query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC',[req.userId]);res.json({data:rows});}catch(e){res.status(500).json({error:'Could not load notifications'});}});
// router.patch('/user/:userId/read-all',requireAuth,async(req,res)=>{try{if(req.params.userId!==req.userId)return res.status(403).json({error:'Forbidden'});await pool.query('UPDATE notifications SET is_read=true WHERE user_id=$1',[req.userId]);res.json({success:true});}catch(e){res.status(500).json({error:'Could not update notifications'});}});
// router.patch('/:id/read',requireAuth,async(req,res)=>{try{await pool.query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2',[req.params.id,req.userId]);res.json({success:true});}catch(e){res.status(500).json({error:'Could not update notification'});}});
// module.exports=router;


const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/user/:userId/unread-count', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { rows } = await pool.query(
      'SELECT count(*)::int AS count FROM notifications WHERE user_id=$1 AND is_read=false',
      [req.userId]
    );

    res.json({ count: rows[0]?.count || 0 });
  } catch (e) {
    res.status(500).json({ error: 'Could not load unread notification count' });
  }
});

router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { rows } = await pool.query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC',
      [req.userId]
    );

    res.json({ data: rows });
  } catch (e) {
    res.status(500).json({ error: 'Could not load notifications' });
  }
});

router.patch('/user/:userId/read-all', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await pool.query(
      'UPDATE notifications SET is_read=true WHERE user_id=$1',
      [req.userId]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not update notifications' });
  }
});

router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not update notification' });
  }
});

module.exports = router;