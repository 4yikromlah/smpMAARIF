// api/siswa/template.js
// Endpoint untuk download template import data siswa

module.exports = async (req, res) => {
  // Set CORS headers agar bisa diakses dari frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Hanya menerima GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Opsi 1: Kirim file Excel kosong yang digenerate secara dinamis
  // (Paling mudah, tanpa perlu file statis)
  try {
    // Generate file Excel sederhana dengan header
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template Siswa');

    // Definisikan kolom yang sesuai dengan kebutuhan import Anda
    worksheet.columns = [
      { header: 'NIS', key: 'nis', width: 15 },
      { header: 'Nama Lengkap', key: 'nama', width: 30 },
      { header: 'Kelas', key: 'kelas', width: 10 },
      { header: 'Jurusan', key: 'jurusan', width: 15 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Password', key: 'password', width: 20 }
    ];

    // Tambahkan contoh baris (opsional)
    worksheet.addRow({
      nis: '12345',
      nama: 'Contoh Siswa',
      kelas: '10',
      jurusan: 'IPA',
      username: 'siswa123',
      password: 'password123'
    });

    // Set response header untuk download file Excel
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="template_siswa.xlsx"');

    // Write workbook ke response stream
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating template:', err);
    res.status(500).json({ error: 'Gagal membuat template' });
  }
};
