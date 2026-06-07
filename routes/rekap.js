const express = require('express');
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  const { kelas, mapel } = req.query;
  let query = supabase
    .from('nilai_ujian')
    .select(`
      *,
      siswa:id_siswa (nama_lengkap, nis, kelas:id_kelas (nama_kelas)),
      ujian:id_ujian (nama_ujian, mata_pelajaran:mapel_id (nama_mapel))
    `);
  if (kelas && kelas !== '') {
    query = query.eq('siswa.kelas.nama_kelas', kelas);
  }
  if (mapel && mapel !== '') {
    query = query.eq('ujian.mata_pelajaran.nama_mapel', mapel);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  const result = data.map(item => ({
    id: item.id,
    siswa: item.siswa?.nama_lengkap || '-',
    nis: item.siswa?.nis || '-',
    kelas: item.siswa?.kelas?.nama_kelas || '-',
    mata_pelajaran: item.ujian?.mata_pelajaran?.nama_mapel || '-',
    ujian: item.ujian?.nama_ujian || '-',
    nilai: item.nilai_total,
    tanggal: item.selesai_pada ? new Date(item.selesai_pada).toLocaleDateString('id-ID') : '-'
  }));
  res.json(result);
});

router.get('/stats', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('nilai_ujian').select('nilai_total, siswa: id_siswa (kelas: id_kelas (nama_kelas))');
  if (error) return res.status(500).json({ error: error.message });
  const totalNilai = data.reduce((s, n) => s + n.nilai_total, 0);
  const rataRata = data.length ? (totalNilai / data.length).toFixed(1) : 0;
  const kelasSet = new Set(data.map(d => d.siswa?.kelas?.nama_kelas).filter(Boolean));
  res.json({ rataRata, totalData: data.length, jumlahKelas: kelasSet.size });
});

module.exports = router;