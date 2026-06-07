-- ======================================================
-- DATABASE: cbt_system (PostgreSQL / Supabase)
-- Sistem CBT (Computer Based Test) Sekolah
-- Versi: 2.0 (Final)
-- ======================================================
-- Catatan: 
-- 1. Jalankan di Supabase SQL Editor.
-- 2. Setelah tabel terbentuk, aktifkan Realtime untuk tabel 
--    'sesi_ujian_siswa' dan 'ujian' melalui dashboard Supabase.
-- 3. Password default untuk semua akun demo adalah 'admin123' 
--    (sudah di-hash dengan bcrypt).
-- ======================================================

-- ======================================================
-- 1. TABEL ADMIN
-- ======================================================
CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    is_utama BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================================
-- 2. KELAS
-- ======================================================
CREATE TABLE IF NOT EXISTS kelas (
    id SERIAL PRIMARY KEY,
    nama_kelas VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================================
-- 3. MATA PELAJARAN
-- ======================================================
CREATE TABLE IF NOT EXISTS mata_pelajaran (
    id SERIAL PRIMARY KEY,
    nama_mapel VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================================
-- 4. GURU
-- ======================================================
CREATE TABLE IF NOT EXISTS guru (
    id SERIAL PRIMARY KEY,
    nip VARCHAR(20) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================================
-- 5. SISWA
-- ======================================================
CREATE TABLE IF NOT EXISTS siswa (
    id SERIAL PRIMARY KEY,
    nis VARCHAR(20) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    id_kelas INTEGER NOT NULL REFERENCES kelas(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================================
-- 6. UJIAN
-- ======================================================
CREATE TABLE IF NOT EXISTS ujian (
    id SERIAL PRIMARY KEY,
    nama_ujian VARCHAR(200) NOT NULL,
    id_mapel INTEGER NOT NULL REFERENCES mata_pelajaran(id) ON DELETE RESTRICT,
    tanggal_mulai TIMESTAMPTZ NOT NULL,
    tanggal_akhir TIMESTAMPTZ NOT NULL,
    durasi_menit INTEGER NOT NULL,
    status VARCHAR(10) DEFAULT 'nonaktif' CHECK (status IN ('aktif', 'nonaktif')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================================
-- 7. PENGAWAS (penugasan guru mengawasi ujian)
-- ======================================================
CREATE TABLE IF NOT EXISTS pengawas (
    id SERIAL PRIMARY KEY,
    id_guru INTEGER NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    id_ujian INTEGER NOT NULL REFERENCES ujian(id) ON DELETE CASCADE,
    ditugaskan_pada TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_guru, id_ujian)
);

-- ======================================================
-- 8. TOKEN UJIAN
-- ======================================================
CREATE TABLE IF NOT EXISTS token_ujian (
    id SERIAL PRIMARY KEY,
    id_ujian INTEGER NOT NULL REFERENCES ujian(id) ON DELETE CASCADE,
    token VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL
);

-- ======================================================
-- 9. SOAL (mendukung 5 jenis soal dengan JSON)
-- ======================================================
CREATE TABLE IF NOT EXISTS soal (
    id SERIAL PRIMARY KEY,
    id_ujian INTEGER NOT NULL REFERENCES ujian(id) ON DELETE CASCADE,
    jenis_soal VARCHAR(30) NOT NULL CHECK (jenis_soal IN ('pilihan_ganda', 'pilihan_ganda_komplek', 'menjodohkan', 'essay', 'benar_salah')),
    pertanyaan TEXT NOT NULL,
    poin INTEGER NOT NULL DEFAULT 1,
    pilihan_json JSONB NULL,
    jawaban_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================================
-- 10. JAWABAN SISWA
-- ======================================================
CREATE TABLE IF NOT EXISTS jawaban_siswa (
    id SERIAL PRIMARY KEY,
    id_siswa INTEGER NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    id_soal INTEGER NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
    jawaban TEXT NULL,
    is_benar BOOLEAN NULL,
    nilai_perolehan DECIMAL(5,2) NULL,
    dijawab_pada TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_siswa, id_soal)
);

-- ======================================================
-- 11. NILAI UJIAN (ringkasan per siswa per ujian)
-- ======================================================
CREATE TABLE IF NOT EXISTS nilai_ujian (
    id SERIAL PRIMARY KEY,
    id_siswa INTEGER NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    id_ujian INTEGER NOT NULL REFERENCES ujian(id) ON DELETE CASCADE,
    nilai_total DECIMAL(5,2) NOT NULL,
    jumlah_benar INTEGER DEFAULT 0,
    jumlah_salah INTEGER DEFAULT 0,
    jumlah_esai INTEGER DEFAULT 0,
    selesai_pada TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_siswa, id_ujian)
);

-- ======================================================
-- 12. SESI UJIAN SISWA (untuk monitoring realtime)
-- ======================================================
CREATE TABLE IF NOT EXISTS sesi_ujian_siswa (
    id SERIAL PRIMARY KEY,
    id_siswa INTEGER NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    id_ujian INTEGER NOT NULL REFERENCES ujian(id) ON DELETE CASCADE,
    token_akses VARCHAR(10) NOT NULL,
    waktu_mulai TIMESTAMPTZ NOT NULL,
    waktu_terakhir_aktivitas TIMESTAMPTZ NOT NULL,
    status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'finished')),
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL
);

-- ======================================================
-- INDEX UNTUK PERFORMANCE
-- ======================================================
CREATE INDEX IF NOT EXISTS idx_admin_username ON admin(username);
CREATE INDEX IF NOT EXISTS idx_guru_username ON guru(username);
CREATE INDEX IF NOT EXISTS idx_siswa_username ON siswa(username);
CREATE INDEX IF NOT EXISTS idx_ujian_status ON ujian(status);
CREATE INDEX IF NOT EXISTS idx_ujian_tanggal ON ujian(tanggal_mulai, tanggal_akhir);
CREATE INDEX IF NOT EXISTS idx_token_aktif ON token_ujian(token, is_active);
CREATE INDEX IF NOT EXISTS idx_nilai_siswa ON nilai_ujian(id_siswa);
CREATE INDEX IF NOT EXISTS idx_nilai_ujian ON nilai_ujian(id_ujian);
CREATE INDEX IF NOT EXISTS idx_sesi_siswa_ujian ON sesi_ujian_siswa(id_siswa, id_ujian, status);
CREATE INDEX IF NOT EXISTS idx_soal_ujian ON soal(id_ujian);

-- ======================================================
-- DATA AWAL (DUMMY)
-- Password menggunakan bcrypt hash dari 'admin123'
-- Hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- ======================================================

-- ADMIN
INSERT INTO admin (username, password, nama_lengkap, is_utama) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator Utama', TRUE),
('ndr',   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', FALSE),
('jaka',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', FALSE)
ON CONFLICT (username) DO NOTHING;

-- KELAS
INSERT INTO kelas (nama_kelas) VALUES 
('7A'),('7B'),('7C'),('8A'),('8B'),('8C'),('9A'),('9B'),('9C'),('12')
ON CONFLICT (nama_kelas) DO NOTHING;

-- MATA PELAJARAN
INSERT INTO mata_pelajaran (nama_mapel) VALUES
('Matematika'),
('Bahasa Indonesia'),
('IPA'),
('Bahasa Inggris'),
('IPS'),
('Pendidikan Agama Islam')
ON CONFLICT (nama_mapel) DO NOTHING;

-- GURU
INSERT INTO guru (nip, username, password, nama_lengkap) VALUES
('198001012010011001', 'ahmad_fauzi',   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ahmad Fauzi, S.Pd'),
('198502122010012002', 'siti_aminah',   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Siti Aminah, S.Pd'),
('199003152010013003', 'budi_santoso', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Budi Santoso, S.Pd.I')
ON CONFLICT (nip) DO NOTHING;

-- SISWA (dengan id_kelas dinamis)
INSERT INTO siswa (nis, username, password, nama_lengkap, id_kelas) VALUES
('006', 'fahmi_ramadhan',   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Fahmi Ramadhan',       (SELECT id FROM kelas WHERE nama_kelas='9C')),
('005', 'eka_prasetya',     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Eka Prasetya',         (SELECT id FROM kelas WHERE nama_kelas='9C')),
('004', 'dodi_saputra',     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dodi Saputra',         (SELECT id FROM kelas WHERE nama_kelas='9B')),
('003', 'citra_anggraini',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Citra Dewi Anggraini', (SELECT id FROM kelas WHERE nama_kelas='9B')),
('002', 'bunga_lestari',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bunga Citra Lestari',  (SELECT id FROM kelas WHERE nama_kelas='9A')),
('001', 'andi_wijaya',      '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Andi Wijaya',          (SELECT id FROM kelas WHERE nama_kelas='9A')),
('1',   'indra_sukamto',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Indra Sukamto',        (SELECT id FROM kelas WHERE nama_kelas='12'))
ON CONFLICT (nis) DO NOTHING;

-- UJIAN
INSERT INTO ujian (nama_ujian, id_mapel, tanggal_mulai, tanggal_akhir, durasi_menit, status) VALUES
('UTS Matematika Ganjil',  (SELECT id FROM mata_pelajaran WHERE nama_mapel='Matematika'),      '2025-03-10 08:00:00+07', '2025-03-10 09:30:00+07', 90, 'nonaktif'),
('UAS Matematika Genap',   (SELECT id FROM mata_pelajaran WHERE nama_mapel='Matematika'),      '2025-06-05 08:00:00+07', '2025-06-05 10:00:00+07', 120, 'nonaktif'),
('UTS Bahasa Indonesia',   (SELECT id FROM mata_pelajaran WHERE nama_mapel='Bahasa Indonesia'),'2025-03-12 08:00:00+07', '2025-03-12 09:30:00+07', 90, 'nonaktif'),
('UAS Bahasa Indonesia',   (SELECT id FROM mata_pelajaran WHERE nama_mapel='Bahasa Indonesia'),'2025-06-07 08:00:00+07', '2025-06-07 10:00:00+07', 120, 'nonaktif'),
('UTS IPA',                (SELECT id FROM mata_pelajaran WHERE nama_mapel='IPA'),             '2025-03-15 08:00:00+07', '2025-03-15 09:30:00+07', 90, 'nonaktif'),
('UAS IPA',                (SELECT id FROM mata_pelajaran WHERE nama_mapel='IPA'),             '2025-06-10 08:00:00+07', '2025-06-10 10:00:00+07', 120, 'nonaktif'),
('UTS Bahasa Inggris',     (SELECT id FROM mata_pelajaran WHERE nama_mapel='Bahasa Inggris'),  '2025-03-18 08:00:00+07', '2025-03-18 09:30:00+07', 90, 'nonaktif'),
('UAS Bahasa Inggris',     (SELECT id FROM mata_pelajaran WHERE nama_mapel='Bahasa Inggris'),  '2026-05-20 08:00:00+07', '2026-05-21 10:00:00+07', 120, 'aktif')
ON CONFLICT DO NOTHING;

-- PENGAWAS
INSERT INTO pengawas (id_guru, id_ujian) VALUES
(1, 1), (2, 2), (1, 3), (3, 4)
ON CONFLICT (id_guru, id_ujian) DO NOTHING;

-- TOKEN UJIAN AKTIF (UAS Bahasa Inggris id=8)
INSERT INTO token_ujian (id_ujian, token, is_active, expires_at) VALUES
(8, 'T4WC', TRUE, NOW() + INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- SOAL (Contoh untuk UAS Bahasa Inggris id=8)
INSERT INTO soal (id_ujian, jenis_soal, pertanyaan, poin, pilihan_json, jawaban_json) VALUES
(8, 'benar_salah', 'Pernyataan: Bahasa Inggris adalah materi yang penting untuk dipelajari.', 1, NULL, '"true"'),
(8, 'menjodohkan', 'Jodohkan pernyataan berikut dengan pasangan yang tepat!', 2, 
 '{"pairs":[{"pernyataan":"1. Hello","pasangan":"A. Selamat pagi"},{"pernyataan":"2. Good morning","pasangan":"B. Halo"}]}',
 '{"matches":[{"pernyataan":1,"pasangan":"B"},{"pernyataan":2,"pasangan":"A"}]}'),
(8, 'pilihan_ganda', 'Berdasarkan materi tentang Descriptive Text, manakah pernyataan berikut yang paling tepat?', 1,
 '{"A":"Descriptive text menjelaskan tentang langkah-langkah membuat sesuatu","B":"Descriptive text bertujuan untuk menggambarkan suatu objek secara detail","C":"Descriptive text menceritakan kejadian secara kronologis","D":"Descriptive text berisi dialog antar tokoh"}',
 '"B"'),
(8, 'pilihan_ganda_komplek', 'Pilihlah semua jawaban yang benar tentang Simple Present Tense!', 2,
 '{"A":"Digunakan untuk menyatakan kebiasaan","B":"Menggunakan verb-ing","C":"Digunakan untuk fakta umum","D":"Untuk subjek he/she/it, kata kerja ditambah s/es"}',
 '["A","C","D"]'),
(8, 'essay', 'Jelaskan secara lengkap tentang penggunaan Simple Past Tense beserta contohnya!', 5, NULL, NULL)
ON CONFLICT DO NOTHING;

-- NILAI UJIAN (Data sesuai tampilan frontend)
INSERT INTO nilai_ujian (id_siswa, id_ujian, nilai_total, jumlah_benar, jumlah_salah, selesai_pada) VALUES
((SELECT id FROM siswa WHERE nis='003'), 5, 94, 20, 2, '2026-05-20 10:30:00+07'),
((SELECT id FROM siswa WHERE nis='005'), 6, 92, 25, 3, '2026-05-20 10:25:00+07'),
((SELECT id FROM siswa WHERE nis='006'), 7, 90, 28, 2, '2026-05-20 10:20:00+07'),
((SELECT id FROM siswa WHERE nis='003'), 7, 89, 27, 3, '2026-05-20 10:15:00+07'),
((SELECT id FROM siswa WHERE nis='001'), 1, 85, 22, 8, '2026-05-20 10:10:00+07'),
((SELECT id FROM siswa WHERE nis='005'), 1, 88, 24, 6, '2026-05-20 10:05:00+07'),
((SELECT id FROM siswa WHERE nis='002'), 4, 82, 20, 10, '2026-05-20 10:00:00+07'),
((SELECT id FROM siswa WHERE nis='001'), 2, 82, 21, 9, '2026-05-20 09:55:00+07'),
((SELECT id FROM siswa WHERE nis='001'), 3, 88, 24, 6, '2026-05-20 09:50:00+07'),
((SELECT id FROM siswa WHERE nis='002'), 3, 84, 22, 8, '2026-05-20 09:45:00+07'),
((SELECT id FROM siswa WHERE nis='003'), 3, 91, 26, 4, '2026-05-20 09:40:00+07'),
((SELECT id FROM siswa WHERE nis='004'), 3, 77, 18, 12, '2026-05-20 09:35:00+07'),
((SELECT id FROM siswa WHERE nis='005'), 3, 86, 23, 7, '2026-05-20 09:30:00+07'),
((SELECT id FROM siswa WHERE nis='006'), 3, 89, 25, 5, '2026-05-20 09:25:00+07'),
((SELECT id FROM siswa WHERE nis='1'),   3, 75, 16, 14, '2026-05-20 09:20:00+07'),
((SELECT id FROM siswa WHERE nis='001'), 5, 90, 28, 2, '2026-05-20 09:15:00+07'),
((SELECT id FROM siswa WHERE nis='002'), 5, 85, 22, 8, '2026-05-20 09:10:00+07'),
((SELECT id FROM siswa WHERE nis='004'), 1, 74, 15, 15, '2026-05-20 09:05:00+07')
ON CONFLICT (id_siswa, id_ujian) DO NOTHING;

-- SESI UJIAN AKTIF (Contoh untuk monitoring)
INSERT INTO sesi_ujian_siswa (id_siswa, id_ujian, token_akses, waktu_mulai, waktu_terakhir_aktivitas, status, ip_address) VALUES
((SELECT id FROM siswa WHERE nis='001'), 8, 'T4WC', NOW(), NOW(), 'active', '192.168.1.100')
ON CONFLICT DO NOTHING;

-- ======================================================
-- AKTIFKAN REALTIME (Lakukan di Dashboard Supabase)
-- ======================================================
-- Untuk mengaktifkan realtime, jalankan perintah berikut di SQL Editor
-- atau melalui Dashboard: Database → Replication → Pilih tabel.
-- 
-- ALTER TABLE sesi_ujian_siswa REPLICA IDENTITY FULL;
-- ALTER TABLE ujian REPLICA IDENTITY FULL;
--
-- Kemudian di Dashboard Supabase:
-- Settings → API → Realtime → Enable Realtime untuk kedua tabel di atas.
-- ======================================================

-- ======================================================
-- AKHIR SCRIPT
-- ======================================================