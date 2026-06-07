const express = require('express');
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/ujian/:idUjian', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('soal')
    .select('*')
    .eq('id_ujian', req.params.idUjian)
    .order('id');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('soal')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAdmin, async (req, res) => {
  const { id_ujian, jenis_soal, pertanyaan, poin, pilihan_json, jawaban_json } = req.body;
  const { data, error } = await supabase
    .from('soal')
    .insert([{ id_ujian, jenis_soal, pertanyaan, poin, pilihan_json, jawaban_json }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { data, error } = await supabase
    .from('soal')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('soal').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;