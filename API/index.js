// backend/api/index.js
module.exports = (req, res) => {
  // Menangani metode HTTP (GET, POST, dll.)
  const { method, url, query, body } = req;

  res.status(200).json({
    message: 'Serverless function berjalan dengan baik!',
    method: method,
    path: url,
    query: query,
    timestamp: new Date().toISOString(),
  });
};