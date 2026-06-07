const express = require('express');
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/active-exams', requireAdmin, async (req, res) => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('ujian')
    .select(`
      *,
      mata_pelajaran: id_mapel (nama_mapel),
      token_ujian (*),
      sesi_ujian_siswa (id, status, siswa: id_siswa (nama_lengkap))
    `)
    .eq('status', 'aktif')
    .lte('tanggal_mulai', now)
    .gte('tanggal_akhir', now);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/update-sesi', requireAdmin, async (req, res) => {
  const { id_sesi, status_baru } = req.body;
  const { error } = await supabase
    .from('sesi_ujian_siswa')
    .update({ status: status_baru, waktu_terakhir_aktivitas: new Date() })
    .eq('id', id_sesi);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;