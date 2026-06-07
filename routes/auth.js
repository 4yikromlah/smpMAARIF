const express = require('express');
const bcrypt = require('bcrypt');
const supabase = require('../supabase');
const router = express.Router();

router.post('/login/admin', async (req, res) => {
  const { username, password } = req.body;
  const { data, error } = await supabase
    .from('admin')
    .select('*')
    .eq('username', username)
    .single();
  if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, data.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  req.session.user = { id: data.id, role: 'admin', nama: data.nama_lengkap };
  res.json({ success: true, role: 'admin', redirect: 'index.html' });
});

router.post('/login/guru', async (req, res) => {
  const { nip, password } = req.body;
  const { data, error } = await supabase
    .from('guru')
    .select('*')
    .eq('nip', nip)
    .single();
  if (error || !data) return res.status(401).json({ error: 'Invalid NIP or password' });
  const valid = await bcrypt.compare(password, data.password);
  if (!valid) return res.status(401).json({ error: 'Invalid password' });
  req.session.user = { id: data.id, role: 'guru', nama: data.nama_lengkap };
  res.json({ success: true, role: 'guru', redirect: 'dashboard_guru.html' });
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

module.exports = router;