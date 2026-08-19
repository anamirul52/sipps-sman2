const pool = require('./src/config/db');

const categories = [
  { name: 'Pakaian tidak sesuai dengan ketentuan yang berlaku', point: 3, penalty: 'Penyelesaian Langsung (Guru yang bersangkutan & Wali Kelas)' },
  { name: 'Memakai jaket/pakaian lain selain seragam, sandal, topi, dan rompi dalam lingkungan sekolah', point: 3, penalty: 'Penyelesaian Langsung (Guru yang bersangkutan & Wali Kelas)' },
  { name: 'Tidak mengikuti kegiatan ekstrakurikuler wajib (Pramuka)', point: 5, penalty: 'Penyelesaian Langsung (Guru yang bersangkutan & Wali Kelas)' },
  { name: 'Terlambat datang ke sekolah', point: 5, penalty: 'Penyelesaian Langsung (Guru Piket & Wali Kelas)' },
  { name: 'Terlambat mengikuti KBM', point: 5, penalty: 'Penyelesaian Langsung (Guru Mapel & Wali Kelas)' },
  { name: 'Mengaktifkan/menggunakan HP pada saat KBM dan kegiatan sekolah lainnya tanpa seizin guru', point: 10, penalty: 'Penyelesaian Langsung (HP diamankan guru)' },
  { name: 'Membawa dan memakai make up dan asesoris yang berlebihan', point: 10, penalty: 'Penyelesaian Langsung (Asesoris diamankan)' },
  { name: 'Parkir tidak pada tempatnya atau mengendarai mobil ke sekolah', point: 10, penalty: 'Penyelesaian Langsung & Peringatan' },
  { name: 'Tidak mengikuti upacara bendera', point: 10, penalty: 'Penyelesaian Langsung & Pembinaan' },
  { name: 'Membolos pada jam pelajaran', point: 10, penalty: 'Penyelesaian Langsung & Pembinaan Wali Kelas' },
  { name: 'Tidak mengikuti kegiatan keagamaan', point: 10, penalty: 'Penyelesaian Langsung & Pembinaan' },
  { name: 'Bagi peserta didik putra, rambut disemir, gondrong, skin head atau rambut tidak rapi', point: 10, penalty: 'Penyelesaian Langsung & Perapian Rambut' },
  { name: 'Keluar/masuk sekolah tidak melewati pintu/jalan yang disediakan', point: 10, penalty: 'Penyelesaian Langsung & Pembinaan' },
  { name: 'Tidak masuk sekolah tanpa izin/keterangan', point: 10, penalty: 'Penyelesaian Langsung & Pemberitahuan ke Ortu' },
  { name: 'Membawa/merokok di lingkungan sekolah', point: 25, penalty: 'Peringatan Tertulis & Pemanggilan Orang Tua/Wali' },
  { name: 'Memalsukan tanda tangan orang tua/wali', point: 25, penalty: 'Peringatan Tertulis & Pemanggilan Orang Tua/Wali' },
  { name: 'Memalsukan tanda tangan guru dan karyawan', point: 50, penalty: 'Peringatan Tertulis II & Pemanggilan Orang Tua/Wali' },
  { name: 'Membuat kekacauan dan kerusuhan di lingkungan sekolah', point: 25, penalty: 'Peringatan Tertulis & Pemanggilan Orang Tua/Wali' },
  { name: 'Merusak alat penunjang pelajaran dan benda/barang milik sekolah yang ada di lingkungan sekolah', point: 25, penalty: 'Peringatan Tertulis, Ganti Rugi & Pemanggilan Orang Tua/Wali' },
  { name: 'Bertato, bertindik', point: 25, penalty: 'Peringatan Tertulis & Pemanggilan Orang Tua/Wali' },
  { name: 'Membawa senjata tajam/benda lain yang bukan peruntukannya bagi kepentingan proses KBM dan kegiatan sekolah', point: 30, penalty: 'Peringatan Tertulis II, Penyitaan & Pemanggilan Orang Tua/Wali' },
  { name: 'Membawa atau melihat gambar/video porno atau membaca majalah/bacaan porno di sekolah', point: 35, penalty: 'Peringatan Tertulis II, Pembinaan Khusus & Pemanggilan Orang Tua/Wali' },
  { name: 'Memalak, menganiaya, dan mengancam warga sekolah', point: 50, penalty: 'Peringatan Tertulis II/III & Pemanggilan Orang Tua/Wali' },
  { name: 'Memberikan informasi di media sosial yang dapat meresahkan di lingkungan sekolah', point: 50, penalty: 'Peringatan Tertulis II/III & Pemanggilan Orang Tua/Wali' },
  { name: 'Penyalahgunaan media sosial yang merugikan citra diri sendiri dan/atau sekolah', point: 50, penalty: 'Peringatan Tertulis II/III & Pemanggilan Orang Tua/Wali' },
  { name: 'Mencuri di dalam/luar lingkungan sekolah', point: 50, penalty: 'Peringatan Tertulis III/Skorsing & Pemanggilan Orang Tua/Wali' },
  { name: 'Berbuat asusila (berzina, perbuatan yang mendekatkan pada zina, dan perbuatan lain yang melanggar norma agama)', point: 75, penalty: 'Peringatan Tertulis III/Skorsing & Pemanggilan Orang Tua/Wali' },
  { name: 'Berkelahi di dalam/luar lingkungan sekolah', point: 75, penalty: 'Peringatan Tertulis III/Skorsing & Pemanggilan Orang Tua/Wali' },
  { name: 'Berjudi atau membawa, menjual, mengonsumsi, membantu pengedaran narkoba atau minuman keras/beralkohol di lingkungan sekolah', point: 100, penalty: 'Orang Tua/Wali Menarik Kembali Peserta Didik dari Sekolah' }
];

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('Altering table schema...');
    await conn.query('ALTER TABLE violation_categories MODIFY name VARCHAR(255)');
    await conn.query('ALTER TABLE sanctions_letters MODIFY status_letter VARCHAR(255)');
    await conn.query('ALTER TABLE sanctions_letters MODIFY violation_summary TEXT');

    console.log('Truncating and populating 29 violation categories...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE violation_categories');
    
    for (const c of categories) {
      await conn.query(
        'INSERT INTO violation_categories (name, point_deduction, penalty_description) VALUES (?, ?, ?)',
        [c.name, c.point, c.penalty]
      );
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    const [rows] = await conn.query('SELECT id, name, point_deduction FROM violation_categories ORDER BY id ASC');
    console.log(`Successfully populated ${rows.length} violation categories!`);
  } catch (err) {
    console.error('Error seeding categories:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
