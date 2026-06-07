const express = require('express');
const bcrypt = require('bcrypt');
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('admin').select('*').order('id');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAdmin, async (req, res) => {
  const { username, password, nama_lengkap, is_utama = false } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('admin')
    .insert([{ username, password: hashed, nama_lengkap, is_utama }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { data: admin } = await supabase.from('admin').select('is_utama').eq('id', id).single();
  if (admin?.is_utama) return res.status(403).json({ error: 'Cannot delete main admin' });
  const { error } = await supabase.from('admin').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;