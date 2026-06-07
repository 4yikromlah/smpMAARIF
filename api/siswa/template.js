// api/siswa/template.js
module.exports = (req, res) => {
  // Set header untuk download file Excel
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="template_siswa.xlsx"');
  
  // Kirim buffer file Excel (contoh: file template statis atau generate)
  // Jika Anda punya file template.xlsx di folder public, baca dan kirim
  const fs = require('fs');
  const path = require('path');
  
  try {
    const filePath = path.join(process.cwd(), 'public', 'template_siswa.xlsx');
    const fileBuffer = fs.readFileSync(filePath);
    res.status(200).send(fileBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Template tidak ditemukan' });
  }
};