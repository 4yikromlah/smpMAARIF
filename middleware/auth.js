function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
}

function requireGuru(req, res, next) {
  if (!req.session.user || (req.session.user.role !== 'guru' && req.session.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Access denied. Guru only.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireGuru };