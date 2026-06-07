const express = require('express');
const bcrypt = require('bcrypt');
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('siswa')
    .select('*, kelas: id_kelas (nama_kelas)')
    .order('id');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAdmin, async (req, res) => {
  const { nis, username, password, nama_lengkap, id_kelas } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('siswa')
    .insert([{ nis, username, password: hashed, nama_lengkap, id_kelas }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('siswa').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;