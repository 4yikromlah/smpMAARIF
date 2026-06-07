const express = require('express');
const ExcelJS = require('exceljs');
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/nilai', requireAdmin, async (req, res) => {
  const { kelas, mapel } = req.query;
  let query = supabase
    .from('nilai_ujian')
    .select(`
      *,
      siswa:id_siswa (nama_lengkap, nis, kelas:id_kelas (nama_kelas)),
      ujian:id_ujian (nama_ujian, mata_pelajaran:mapel_id (nama_mapel))
    `);
  if (kelas && kelas !== '') query = query.eq('siswa.kelas.nama_kelas', kelas);
  if (mapel && mapel !== '') query = query.eq('ujian.mata_pelajaran.nama_mapel', mapel);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Rekap Nilai');
  worksheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'NIS', key: 'nis', width: 12 },
    { header: 'Nama Siswa', key: 'siswa', width: 25 },
    { header: 'Kelas', key: 'kelas', width: 8 },
    { header: 'Mata Pelajaran', key: 'mapel', width: 20 },
    { header: 'Ujian', key: 'ujian', width: 25 },
    { header: 'Nilai', key: 'nilai', width: 8 },
    { header: 'Tanggal', key: 'tanggal', width: 15 }
  ];
  worksheet.getRow(1).font = { bold: true };
  data.forEach((item, idx) => {
    worksheet.addRow({
      no: idx + 1,
      nis: item.siswa?.nis,
      siswa: item.siswa?.nama_lengkap,
      kelas: item.siswa?.kelas?.nama_kelas,
      mapel: item.ujian?.mata_pelajaran?.nama_mapel,
      ujian: item.ujian?.nama_ujian,
      nilai: item.nilai_total,
      tanggal: item.selesai_pada ? new Date(item.selesai_pada).toLocaleDateString('id-ID') : ''
    });
  });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="rekap_nilai.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;