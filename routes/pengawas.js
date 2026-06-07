const express = require('express');
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('pengawas')
    .select('*, guru: id_guru (*), ujian: id_ujian (*)')
    .order('id');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAdmin, async (req, res) => {
  const { id_guru, id_ujian } = req.body;
  const { data, error } = await supabase.from('pengawas').insert([{ id_guru, id_ujian }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('pengawas').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;