const express = require('express');
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('mata_pelajaran').select('*').order('id');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAdmin, async (req, res) => {
  const { nama_mapel } = req.body;
  const { data, error } = await supabase.from('mata_pelajaran').insert([{ nama_mapel }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('mata_pelajaran').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;