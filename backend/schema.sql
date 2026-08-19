CREATE DATABASE IF NOT EXISTS db_pelanggaran_siswa;
USE db_pelanggaran_siswa;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role ENUM('admin','bk','piket','wali_kelas','parent','student'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_name VARCHAR(50),
  homeroom_teacher_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (homeroom_teacher_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nipd VARCHAR(20) UNIQUE,
  name VARCHAR(100),
  class_id INT,
  parent_phone VARCHAR(20),
  total_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

CREATE TABLE IF NOT EXISTS violation_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  point_deduction INT,
  penalty_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_violations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  category_id INT,
  reported_by_teacher_id INT,
  violation_date DATE,
  note TEXT,
  photo_proof_url VARCHAR(255),
  status ENUM('pending','processed','resolved') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (category_id) REFERENCES violation_categories(id),
  FOREIGN KEY (reported_by_teacher_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sanctions_letters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  violation_summary TEXT,
  point_threshold INT,
  status_letter VARCHAR(255),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Seed Data Users
INSERT INTO users (name, email, password, role) VALUES 
('Admin System', 'admin@school.id', '$2a$10$jWuLUXHdwpzwFsB5bKfnuufSK6WsFxtXg7xQUBNtYUKtcV8A9EjyO', 'admin')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seed Data 29 Violation Categories
INSERT INTO violation_categories (id, name, point_deduction, penalty_description) VALUES 
(1, 'Pakaian tidak sesuai dengan ketentuan yang berlaku', 3, 'Penyelesaian Langsung (Guru yang bersangkutan & Wali Kelas)'),
(2, 'Memakai jaket/pakaian lain selain seragam, sandal, topi, dan rompi dalam lingkungan sekolah', 3, 'Penyelesaian Langsung (Guru yang bersangkutan & Wali Kelas)'),
(3, 'Tidak mengikuti kegiatan ekstrakurikuler wajib (Pramuka)', 5, 'Penyelesaian Langsung (Guru yang bersangkutan & Wali Kelas)'),
(4, 'Terlambat datang ke sekolah', 5, 'Penyelesaian Langsung (Guru Piket & Wali Kelas)'),
(5, 'Terlambat mengikuti KBM', 5, 'Penyelesaian Langsung (Guru Mapel & Wali Kelas)'),
(6, 'Mengaktifkan/menggunakan HP pada saat KBM dan kegiatan sekolah lainnya tanpa seizin guru', 10, 'Penyelesaian Langsung (HP diamankan guru)'),
(7, 'Membawa dan memakai make up dan asesoris yang berlebihan', 10, 'Penyelesaian Langsung (Asesoris diamankan)'),
(8, 'Parkir tidak pada tempatnya atau mengendarai mobil ke sekolah', 10, 'Penyelesaian Langsung & Peringatan'),
(9, 'Tidak mengikuti upacara bendera', 10, 'Penyelesaian Langsung & Pembinaan'),
(10, 'Membolos pada jam pelajaran', 10, 'Penyelesaian Langsung & Pembinaan Wali Kelas'),
(11, 'Tidak mengikuti kegiatan keagamaan', 10, 'Penyelesaian Langsung & Pembinaan'),
(12, 'Bagi peserta didik putra, rambut disemir, gondrong, skin head atau rambut tidak rapi', 10, 'Penyelesaian Langsung & Perapian Rambut'),
(13, 'Keluar/masuk sekolah tidak melewati pintu/jalan yang disediakan', 10, 'Penyelesaian Langsung & Pembinaan'),
(14, 'Tidak masuk sekolah tanpa izin/keterangan', 10, 'Penyelesaian Langsung & Pemberitahuan ke Ortu'),
(15, 'Membawa/merokok di lingkungan sekolah', 25, 'Peringatan Tertulis & Pemanggilan Orang Tua/Wali'),
(16, 'Memalsukan tanda tangan orang tua/wali', 25, 'Peringatan Tertulis & Pemanggilan Orang Tua/Wali'),
(17, 'Memalsukan tanda tangan guru dan karyawan', 50, 'Peringatan Tertulis II & Pemanggilan Orang Tua/Wali'),
(18, 'Membuat kekacauan dan kerusuhan di lingkungan sekolah', 25, 'Peringatan Tertulis & Pemanggilan Orang Tua/Wali'),
(19, 'Merusak alat penunjang pelajaran dan benda/barang milik sekolah yang ada di lingkungan sekolah', 25, 'Peringatan Tertulis, Ganti Rugi & Pemanggilan Orang Tua/Wali'),
(20, 'Bertato, bertindik', 25, 'Peringatan Tertulis & Pemanggilan Orang Tua/Wali'),
(21, 'Membawa senjata tajam/benda lain yang bukan peruntukannya bagi kepentingan proses KBM dan kegiatan sekolah', 30, 'Peringatan Tertulis II, Penyitaan & Pemanggilan Orang Tua/Wali'),
(22, 'Membawa atau melihat gambar/video porno atau membaca majalah/bacaan porno di sekolah', 35, 'Peringatan Tertulis II, Pembinaan Khusus & Pemanggilan Orang Tua/Wali'),
(23, 'Memalak, menganiaya, dan mengancam warga sekolah', 50, 'Peringatan Tertulis II/III & Pemanggilan Orang Tua/Wali'),
(24, 'Memberikan informasi di media sosial yang dapat meresahkan di lingkungan sekolah', 50, 'Peringatan Tertulis II/III & Pemanggilan Orang Tua/Wali'),
(25, 'Penyalahgunaan media sosial yang merugikan citra diri sendiri dan/atau sekolah', 50, 'Peringatan Tertulis II/III & Pemanggilan Orang Tua/Wali'),
(26, 'Mencuri di dalam/luar lingkungan sekolah', 50, 'Peringatan Tertulis III/Skorsing & Pemanggilan Orang Tua/Wali'),
(27, 'Berbuat asusila (berzina, perbuatan yang mendekatkan pada zina, dan perbuatan lain yang melanggar norma agama)', 75, 'Peringatan Tertulis III/Skorsing & Pemanggilan Orang Tua/Wali'),
(28, 'Berkelahi di dalam/luar lingkungan sekolah', 75, 'Peringatan Tertulis III/Skorsing & Pemanggilan Orang Tua/Wali'),
(29, 'Berjudi atau membawa, menjual, mengonsumsi, membantu pengedaran narkoba atau minuman keras/beralkohol di lingkungan sekolah', 100, 'Orang Tua/Wali Menarik Kembali Peserta Didik dari Sekolah')
ON DUPLICATE KEY UPDATE name=VALUES(name), point_deduction=VALUES(point_deduction), penalty_description=VALUES(penalty_description);

-- Seed Data 33 Classes (X-A s/d XII-K)
INSERT IGNORE INTO classes (class_name, homeroom_teacher_id) VALUES 
('X-A', 1), ('X-B', 1), ('X-C', 1), ('X-D', 1), ('X-E', 1), ('X-F', 1), ('X-G', 1), ('X-H', 1), ('X-I', 1), ('X-J', 1), ('X-K', 1),
('XI-A', 1), ('XI-B', 1), ('XI-C', 1), ('XI-D', 1), ('XI-E', 1), ('XI-F', 1), ('XI-G', 1), ('XI-H', 1), ('XI-I', 1), ('XI-J', 1), ('XI-K', 1),
('XII-A', 1), ('XII-B', 1), ('XII-C', 1), ('XII-D', 1), ('XII-E', 1), ('XII-F', 1), ('XII-G', 1), ('XII-H', 1), ('XII-I', 1), ('XII-J', 1), ('XII-K', 1);
