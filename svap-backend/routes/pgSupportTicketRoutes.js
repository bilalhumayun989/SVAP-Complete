const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const profiles = require('../controllers/pgProfileController');

const router = express.Router();

router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    const { rows } = await pool.query(
      `SELECT t.id,t.user_id,t.subject,t.message,t.status,
        to_jsonb(t)->>'admin_reply' AS admin_reply,
        to_jsonb(t)->>'replied_at' AS replied_at,
        to_jsonb(t)->>'created_at' AS created_at
       FROM support_tickets t
       WHERE t.user_id=$1
       ORDER BY to_jsonb(t)->>'created_at' DESC NULLS LAST`,
      [req.userId]
    );
    res.json({ data: rows });
  } catch (error) {
    console.error('[support tickets list]', error.message);
    res.status(500).json({ error: 'Could not load support tickets' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    await profiles.ensureProfile(
      req.userId, req.authUser?.email,
      req.authUser?.user_metadata?.full_name || req.authUser?.user_metadata?.name,
      req.authUser?.user_metadata?.avatar_url || req.authUser?.user_metadata?.picture
    );
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });
    if (subject.length > 200 || message.length > 10000) {
      return res.status(400).json({ error: 'Ticket subject or message is too long' });
    }
    const { rows } = await pool.query(
      'INSERT INTO support_tickets(user_id,subject,message) VALUES($1,$2,$3) RETURNING *',
      [req.userId, subject, message]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    console.error('[support ticket create]', error.message);
    res.status(500).json({ error: 'Could not submit support ticket' });
  }
});

router.patch('/:id/reply', requireAuth, requireAdmin, async (req, res) => {
  const reply = String(req.body?.admin_reply || '').trim();
  if (!reply) return res.status(400).json({ error: 'Reply is required' });
  try {
    const { rows } = await pool.query(
      "UPDATE support_tickets SET admin_reply=$1,status='replied',replied_at=now() WHERE id=$2 RETURNING *",
      [reply, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    console.error('[support ticket reply]', error.message);
    res.status(500).json({ error: 'Could not reply to ticket' });
  }
});

module.exports = router;
