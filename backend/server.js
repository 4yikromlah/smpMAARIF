const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const supabase = require('./supabase');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3001', credentials: true }
});

// Security middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3001', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/guru', require('./routes/guru'));
app.use('/api/siswa', require('./routes/siswa'));
app.use('/api/ujian', require('./routes/ujian'));
app.use('/api/soal', require('./routes/soal'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/rekap', require('./routes/rekap'));
app.use('/api/export', require('./routes/export'));
app.use('/api/monitoring', require('./routes/monitoring'));
app.use('/api/mapel', require('./routes/mapel'));
app.use('/api/kelas', require('./routes/kelas'));
app.use('/api/pengawas', require('./routes/pengawas'));
app.use('/api/token', require('./routes/token'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO realtime
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  const sesiChannel = supabase.channel('sesi-channel');
  sesiChannel.on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'sesi_ujian_siswa'
  }, (payload) => {
    io.emit('sesi-update', payload);
  }).subscribe();

  const ujianChannel = supabase.channel('ujian-channel');
  ujianChannel.on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'ujian',
    filter: 'status=eq.aktif'
  }, (payload) => {
    io.emit('ujian-status-change', payload);
  }).subscribe();

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});