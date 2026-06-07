const express = require('express');
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('ujian')
    .select('*, mata_pelajaran: id_mapel (nama_mapel)')
    .order('id', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('ujian')
    .select('*, mata_pelajaran: id_mapel (nama_mapel)')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  // Sertakan nilai siswa jika diminta
  if (req.query.include_nilai === 'true') {
    const { data: nilai, error: err2 } = await supabase
      .from('nilai_ujian')
      .select('*, siswa: id_siswa (*, kelas: id_kelas (nama_kelas))')
      .eq('id_ujian', req.params.id);
    if (!err2) data.nilai_siswa = nilai;
  }
  res.json(data);
});

router.post('/', requireAdmin, async (req, res) => {
  const { nama_ujian, id_mapel, tanggal_mulai, tanggal_akhir, durasi_menit, status } = req.body;
  const { data, error } = await supabase
    .from('ujian')
    .insert([{ nama_ujian, id_mapel, tanggal_mulai, tanggal_akhir, durasi_menit, status }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { data, error } = await supabase
    .from('ujian')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('ujian').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;