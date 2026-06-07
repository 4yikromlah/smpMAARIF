const express = require('express');
const bcrypt = require('bcrypt');
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('guru').select('*').order('id');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAdmin, async (req, res) => {
  const { nip, username, password, nama_lengkap } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('guru')
    .insert([{ nip, username, password: hashed, nama_lengkap }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('guru').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Dashboard guru (ujian yang diawasi)
router.get('/dashboard', requireAdmin, async (req, res) => {
  const guruId = req.session.user.id;
  const { data: pengawasList, error } = await supabase
    .from('pengawas')
    .select('ujian: id_ujian (*, mata_pelajaran: mapel_id (nama_mapel))')
    .eq('id_guru', guruId);
  if (error) return res.status(500).json({ error: error.message });
  const ujian = pengawasList.map(p => p.ujian);
  res.json({ ujian, jumlahPengawasan: ujian.length, ujianAktif: ujian.filter(u => u.status === 'aktif').length });
});

module.exports = router;