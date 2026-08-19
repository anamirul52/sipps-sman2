const mysql = require('mysql2/promise');

async function migrateAiven() {
    console.log('⏳ Menghubungkan ke Aiven MySQL Cloud...');
    
    require('dotenv').config();
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'smanda02-anamirul52-e999.h.aivencloud.com',
        port: parseInt(process.env.DB_PORT) || 16021,
        user: process.env.DB_USER || 'avnadmin',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'defaultdb',
        ssl: {
            rejectUnauthorized: false
        }
    });

    console.log('✅ Berhasil terhubung ke Aiven MySQL!');

    console.log('⏳ Membuat tabel-tabel database...');

    // 1. Users table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(100) UNIQUE,
            password VARCHAR(255),
            role ENUM('admin','bk','piket','wali_kelas','parent','student'),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✓ Tabel users siap');

    // 2. Classes table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS classes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_name VARCHAR(50),
            homeroom_teacher_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (homeroom_teacher_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `);
    console.log('✓ Tabel classes siap');

    // 3. Students table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nipd VARCHAR(20) UNIQUE,
            name VARCHAR(100),
            class_id INT,
            parent_phone VARCHAR(20),
            total_points INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
        )
    `);
    console.log('✓ Tabel students siap');

    // 4. Violation Categories
    await connection.query(`
        CREATE TABLE IF NOT EXISTS violation_categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            point_deduction INT,
            penalty_description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✓ Tabel violation_categories siap');

    // 5. Student Violations
    await connection.query(`
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
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES violation_categories(id),
            FOREIGN KEY (reported_by_teacher_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `);
    console.log('✓ Tabel student_violations siap');

    // 6. Sanctions Letters
    await connection.query(`
        CREATE TABLE IF NOT EXISTS sanctions_letters (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT,
            violation_summary TEXT,
            point_threshold INT,
            status_letter VARCHAR(255),
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )
    `);
    console.log('✓ Tabel sanctions_letters siap');

    // Seed Super Admin
    await connection.query(`
        INSERT INTO users (name, email, password, role) VALUES 
        ('Super Admin SMAN 2', 'superadmin@school.id', '$2a$10$jWuLUXHdwpzwFsB5bKfnuufSK6WsFxtXg7xQUBNtYUKtcV8A9EjyO', 'admin'),
        ('Guru BK SMAN 2', 'bk@school.id', '$2a$10$jWuLUXHdwpzwFsB5bKfnuufSK6WsFxtXg7xQUBNtYUKtcV8A9EjyO', 'bk'),
        ('Guru Piket SMAN 2', 'piket@school.id', '$2a$10$jWuLUXHdwpzwFsB5bKfnuufSK6WsFxtXg7xQUBNtYUKtcV8A9EjyO', 'piket'),
        ('Wali Kelas SMAN 2', 'walikelas@school.id', '$2a$10$jWuLUXHdwpzwFsB5bKfnuufSK6WsFxtXg7xQUBNtYUKtcV8A9EjyO', 'wali_kelas')
        ON DUPLICATE KEY UPDATE name=VALUES(name)
    `);
    console.log('✓ Akun Super Admin & Demo Guru berhasil dibuat');

    // Seed 29 Categories
    const categories = [
        [1, 'Pakaian tidak sesuai dengan ketentuan yang berlaku', 3, 'Penyelesaian Langsung (Guru yang bersangkutan & Wali Kelas)'],
        [2, 'Memakai jaket/pakaian lain selain seragam, sandal, topi, dan rompi dalam lingkungan sekolah', 3, 'Penyelesaian Langsung (Guru yang bersangkutan & Wali Kelas)'],
        [3, 'Tidak mengikuti kegiatan ekstrakurikuler wajib (Pramuka)', 5, 'Penyelesaian Langsung (Guru yang bersangkutan & Wali Kelas)'],
        [4, 'Terlambat datang ke sekolah', 5, 'Penyelesaian Langsung (Guru Piket & Wali Kelas)'],
        [5, 'Terlambat mengikuti KBM', 5, 'Penyelesaian Langsung (Guru Mapel & Wali Kelas)'],
        [6, 'Mengaktifkan/menggunakan HP pada saat KBM dan kegiatan sekolah lainnya tanpa seizin guru', 10, 'Penyelesaian Langsung (HP diamankan guru)'],
        [7, 'Membawa dan memakai make up dan asesoris yang berlebihan', 10, 'Penyelesaian Langsung (Asesoris diamankan)'],
        [8, 'Parkir tidak pada tempatnya atau mengendarai mobil ke sekolah', 10, 'Penyelesaian Langsung & Peringatan'],
        [9, 'Tidak mengikuti upacara bendera', 10, 'Penyelesaian Langsung & Pembinaan'],
        [10, 'Membolos pada jam pelajaran', 10, 'Penyelesaian Langsung & Pembinaan Wali Kelas'],
        [11, 'Tidak mengikuti kegiatan keagamaan', 10, 'Penyelesaian Langsung & Pembinaan'],
        [12, 'Bagi peserta didik putra, rambut disemir, gondrong, skin head atau rambut tidak rapi', 10, 'Penyelesaian Langsung & Perapian Rambut'],
        [13, 'Keluar/masuk sekolah tidak melewati pintu/jalan yang disediakan', 10, 'Penyelesaian Langsung & Pembinaan'],
        [14, 'Tidak masuk sekolah tanpa izin/keterangan', 10, 'Penyelesaian Langsung & Pemberitahuan ke Ortu'],
        [15, 'Membawa/merokok di lingkungan sekolah', 25, 'Peringatan Tertulis & Pemanggilan Orang Tua/Wali'],
        [16, 'Memalsukan tanda tangan orang tua/wali', 25, 'Peringatan Tertulis & Pemanggilan Orang Tua/Wali'],
        [17, 'Memalsukan tanda tangan guru dan karyawan', 50, 'Peringatan Tertulis II & Pemanggilan Orang Tua/Wali'],
        [18, 'Membuat kekacauan dan kerusuhan di lingkungan sekolah', 25, 'Peringatan Tertulis & Pemanggilan Orang Tua/Wali'],
        [19, 'Merusak alat penunjang pelajaran dan benda/barang milik sekolah yang ada di lingkungan sekolah', 25, 'Peringatan Tertulis, Ganti Rugi & Pemanggilan Orang Tua/Wali'],
        [20, 'Bertato, bertindik', 25, 'Peringatan Tertulis & Pemanggilan Orang Tua/Wali'],
        [21, 'Membawa senjata tajam/benda lain yang bukan peruntukannya bagi kepentingan proses KBM dan kegiatan sekolah', 30, 'Peringatan Tertulis II, Penyitaan & Pemanggilan Orang Tua/Wali'],
        [22, 'Membawa atau melihat gambar/video porno atau membaca majalah/bacaan porno di sekolah', 35, 'Peringatan Tertulis II, Pembinaan Khusus & Pemanggilan Orang Tua/Wali'],
        [23, 'Memalak, menganiaya, dan mengancam warga sekolah', 50, 'Peringatan Tertulis II/III & Pemanggilan Orang Tua/Wali'],
        [24, 'Memberikan informasi di media sosial yang dapat meresahkan di lingkungan sekolah', 50, 'Peringatan Tertulis II/III & Pemanggilan Orang Tua/Wali'],
        [25, 'Penyalahgunaan media sosial yang merugikan citra diri sendiri dan/atau sekolah', 50, 'Peringatan Tertulis II/III & Pemanggilan Orang Tua/Wali'],
        [26, 'Mencuri di dalam/luar lingkungan sekolah', 50, 'Peringatan Tertulis III/Skorsing & Pemanggilan Orang Tua/Wali'],
        [27, 'Berbuat asusila (berzina, perbuatan yang mendekatkan pada zina, dan perbuatan lain yang melanggar norma agama)', 75, 'Peringatan Tertulis III/Skorsing & Pemanggilan Orang Tua/Wali'],
        [28, 'Berkelahi di dalam/luar lingkungan sekolah', 75, 'Peringatan Tertulis III/Skorsing & Pemanggilan Orang Tua/Wali'],
        [29, 'Berjudi atau membawa, menjual, mengonsumsi, membantu pengedaran narkoba atau minuman keras/beralkohol di lingkungan sekolah', 100, 'Orang Tua/Wali Menarik Kembali Peserta Didik dari Sekolah']
    ];

    for (const cat of categories) {
        await connection.query(
            'INSERT INTO violation_categories (id, name, point_deduction, penalty_description) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), point_deduction=VALUES(point_deduction), penalty_description=VALUES(penalty_description)',
            cat
        );
    }
    console.log('✓ 29 Kategori Pelanggaran Resmi berhasil di-import');

    // Seed 33 Classes
    const classNames = [
        'X-A', 'X-B', 'X-C', 'X-D', 'X-E', 'X-F', 'X-G', 'X-H', 'X-I', 'X-J', 'X-K',
        'XI-A', 'XI-B', 'XI-C', 'XI-D', 'XI-E', 'XI-F', 'XI-G', 'XI-H', 'XI-I', 'XI-J', 'XI-K',
        'XII-A', 'XII-B', 'XII-C', 'XII-D', 'XII-E', 'XII-F', 'XII-G', 'XII-H', 'XII-I', 'XII-J', 'XII-K'
    ];

    for (const cName of classNames) {
        await connection.query(
            'INSERT INTO classes (class_name, homeroom_teacher_id) SELECT ?, 1 WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_name = ?)',
            [cName, cName]
        );
    }
    console.log('✓ 33 Kelas (X-A s/d XII-K) berhasil di-import');

    console.log('\n🎉 SEMUA TABEL & DATA BERHASIL DI-MIGRASI KE AIVEN CLOUD MYSQL! 🚀');
    await connection.end();
}

migrateAiven().catch(err => {
    console.error('❌ Terjadi kesalahan:', err);
});
