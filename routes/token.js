const express = require('express');
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

function generateToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 5; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

router.post('/refresh', requireAdmin, async (req, res) => {
  const { id_ujian } = req.body;
  if (!id_ujian) return res.status(400).json({ error: 'id_ujian required' });
  const newToken = generateToken();
  const { data, error } = await supabase
    .from('token_ujian')
    .upsert({ id_ujian, token: newToken, is_active: true, expires_at: new Date(Date.now() + 24*60*60*1000) })
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, token: newToken });
});

module.exports = router;