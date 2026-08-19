const pool = require('../config/db');
const XLSX = require('xlsx');

exports.getAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || '';
        const class_id = req.query.class_id || '';
        const isAll = req.query.limit === 'all' || req.query.all === 'true' || (!req.query.page && !req.query.limit);
        const limit = isAll ? 10000 : (parseInt(req.query.limit) || 20);
        const offset = isAll ? 0 : (page - 1) * limit;

        let query = `
            SELECT s.*, s.nipd, s.nipd as nisn, c.class_name 
            FROM students s 
            LEFT JOIN classes c ON s.class_id = c.id 
            WHERE 1=1
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM students s WHERE 1=1';
        let queryParams = [];
        let countParams = [];

        if (search) {
            query += ' AND (s.name LIKE ? OR s.nipd LIKE ?)';
            countQuery += ' AND (s.name LIKE ? OR s.nipd LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`);
            countParams.push(`%${search}%`, `%${search}%`);
        }

        if (class_id) {
            query += ' AND s.class_id = ?';
            countQuery += ' AND s.class_id = ?';
            queryParams.push(class_id);
            countParams.push(class_id);
        }

        query += ' ORDER BY s.name ASC';
        if (!isAll) {
            query += ' LIMIT ? OFFSET ?';
            queryParams.push(limit, offset);
        }

        const [students] = await pool.query(query, queryParams);
        const [[{ total }]] = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: students,
            pagination: {
                page: isAll ? 1 : page,
                limit: isAll ? total : limit,
                total,
                totalPages: isAll ? 1 : Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error in student getAll:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data siswa' });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        const [students] = await pool.query(`
            SELECT s.*, s.nipd, s.nipd as nisn, c.class_name 
            FROM students s 
            LEFT JOIN classes c ON s.class_id = c.id 
            WHERE s.id = ?
        `, [id]);

        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan' });
        }

        const [violations] = await pool.query(`
            SELECT sv.*, vc.name as category_name, vc.point_deduction, u.name as reported_by
            FROM student_violations sv
            JOIN violation_categories vc ON sv.category_id = vc.id
            LEFT JOIN users u ON sv.reported_by_teacher_id = u.id
            WHERE sv.student_id = ?
            ORDER BY sv.violation_date DESC
        `, [id]);

        const studentData = students[0];
        studentData.violations = violations;

        res.json({ success: true, data: studentData });
    } catch (error) {
        console.error('Error in student getById:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil detail siswa' });
    }
};

exports.create = async (req, res) => {
    try {
        const nipd = req.body.nipd || req.body.nisn;
        const { name, class_id, parent_phone } = req.body;

        if (!nipd || !name || !class_id) {
            return res.status(400).json({ success: false, message: 'NIPD, Nama, dan Kelas wajib diisi' });
        }

        const [existing] = await pool.query('SELECT id FROM students WHERE nipd = ?', [nipd]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'NIPD sudah terdaftar' });
        }

        const [result] = await pool.query(
            'INSERT INTO students (nipd, name, class_id, parent_phone, total_points) VALUES (?, ?, ?, ?, 0)',
            [nipd, name, class_id, parent_phone || '']
        );

        res.status(201).json({
            success: true,
            message: 'Data siswa berhasil ditambahkan',
            data: { id: result.insertId, nipd, name, class_id }
        });
    } catch (error) {
        console.error('Error in student create:', error);
        res.status(500).json({ success: false, message: 'Gagal menambahkan data siswa' });
    }
};

exports.getClasses = async (req, res) => {
    try {
        const [classes] = await pool.query(`
            SELECT id, class_name 
            FROM classes 
            ORDER BY FIELD(SUBSTRING_INDEX(class_name, '-', 1), 'X', 'XI', 'XII'), class_name ASC
        `);
        res.json({ success: true, data: classes });
    } catch (error) {
        console.error('Error in getClasses:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data kelas' });
    }
};

// Helper normalisasi nama kelas (misal: "10-A" -> "X-A", "X A" -> "X-A", "10 A" -> "X-A")
function normalizeClassName(input) {
    if (!input) return '';
    let str = input.toString().trim().toUpperCase();
    str = str.replace(/\s+/g, '-').replace(/_+/g, '-');
    str = str.replace(/^10-/, 'X-').replace(/^11-/, 'XI-').replace(/^12-/, 'XII-');
    return str;
}

// Helper untuk label status sanksi berdasarkan 7 jenjang poin resmi
function getStatusLabel(points) {
    if (points >= 100) return 'Orang Tua/Wali Menarik Kembali Peserta Didik dari Sekolah (≥100 Poin)';
    if (points >= 76) return 'Pemberian Skorsing (76-99 Poin)';
    if (points >= 51) return 'Peringatan Tertulis III & Surat Pernyataan Bermeterai (51-75 Poin)';
    if (points >= 26) return 'Peringatan Tertulis II (26-50 Poin)';
    if (points >= 21) return 'Peringatan Tertulis I (21-25 Poin)';
    if (points >= 11) return 'Penyelesaian Langsung (11-20 Poin) - Pemberitahuan Ortu';
    return 'Penyelesaian Langsung (0-10 Poin)';
}

/**
 * IMPORT EXCEL (Mendukung 1 Angkatan & Multi-Sheet)
 * Dapat membaca seluruh sheet dalam satu file Excel (misal Sheet: X-A, X-B, ... s/d X-K)
 * atau satu sheet tunggal yang berisi semua kelas angkatan.
 */
exports.importExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File Excel (.xlsx/.xls) wajib diunggah' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            return res.status(400).json({ success: false, message: 'File Excel tidak memiliki lembar kerja (sheet)' });
        }

        // Ambil semua data kelas dari database
        const [classes] = await pool.query('SELECT id, class_name FROM classes');
        const classMap = new Map();
        classes.forEach(c => {
            classMap.set(c.class_name.toUpperCase(), c.id);
            classMap.set(normalizeClassName(c.class_name), c.id);
        });

        let totalProcessed = 0;
        let successCount = 0;
        let errors = [];
        let sheetSummaries = [];

        // Loop SEMUA sheet di dalam file Excel (Mendukung 1 Angkatan Sekaligus)
        for (const sheetName of workbook.SheetNames) {
            // Lewati sheet instruksi atau referensi
            if (['REFERENSI KELAS', 'REFERENSI', 'PANDUAN', 'PETUNJUK'].includes(sheetName.toUpperCase())) {
                continue;
            }

            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            if (!rows || rows.length === 0) continue;

            const normalizedSheetClass = normalizeClassName(sheetName);
            const sheetClassId = classMap.get(normalizedSheetClass);

            let sheetSuccess = 0;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const rowNumber = i + 2;
                totalProcessed++;

                // Field extraction
                const nipdRaw = row['NIPD'] || row['nipd'] || row['Nipd'] || row['NISN'] || row['nisn'] || row['Nisn'] || row['No Induk'] || '';
                const nameRaw = row['Nama Siswa'] || row['Nama'] || row['nama'] || row['Nama Lengkap'] || row['name'] || '';
                const classRaw = row['Kelas'] || row['kelas'] || row['Class'] || row['class_name'] || '';
                const phoneRaw = row['No HP Orang Tua'] || row['No Telp Ortu'] || row['Telepon Ortu'] || row['No WhatsApp'] || row['No Telp'] || row['parent_phone'] || '';

                const nipd = nipdRaw.toString().trim();
                const name = nameRaw.toString().trim();
                const parent_phone = phoneRaw.toString().trim();

                // Abaikan baris kosong total
                if (!nipd && !name) continue;

                if (!nipd || !name) {
                    errors.push(`[Sheet: ${sheetName}, Baris ${rowNumber}] NIPD dan Nama Siswa wajib diisi.`);
                    continue;
                }

                // Tentukan Class ID (dari kolom Kelas atau dari Nama Sheet jika sesuai nama kelas)
                let targetClassId = null;
                if (classRaw) {
                    const normalized = normalizeClassName(classRaw);
                    targetClassId = classMap.get(normalized);
                } else if (sheetClassId) {
                    targetClassId = sheetClassId;
                }

                if (!targetClassId) {
                    errors.push(`[Sheet: ${sheetName}, Baris ${rowNumber}] Kelas "${classRaw || sheetName}" tidak valid di sistem.`);
                    continue;
                }

                // Simpan atau update siswa
                await pool.query(
                    `INSERT INTO students (nipd, name, class_id, parent_phone, total_points)
                     VALUES (?, ?, ?, ?, 0)
                     ON DUPLICATE KEY UPDATE 
                        name = VALUES(name),
                        class_id = VALUES(class_id),
                        parent_phone = VALUES(parent_phone)`,
                    [nipd, name, targetClassId, parent_phone]
                );

                successCount++;
                sheetSuccess++;
            }

            sheetSummaries.push({
                sheet: sheetName,
                imported: sheetSuccess
            });
        }

        res.json({
            success: true,
            message: `Berhasil mengimpor ${successCount} siswa dari ${workbook.SheetNames.length} sheet.${errors.length > 0 ? ` (${errors.length} baris gagal)` : ''}`,
            data: {
                total_processed: totalProcessed,
                success_count: successCount,
                error_count: errors.length,
                sheet_summaries: sheetSummaries,
                errors
            }
        });

    } catch (error) {
        console.error('Error in importExcel:', error);
        res.status(500).json({ success: false, message: 'Gagal memproses file Excel: ' + error.message });
    }
};

/**
 * EXPORT DATA SISWA KE EXCEL (.xlsx)
 * Mendukung ekspor:
 * - Seluruh siswa sekolah
 * - 1 Angkatan penuh (Tingkat X, XI, atau XII)
 * - 1 Kelas tertentu (misal X-A)
 */
exports.exportExcel = async (req, res) => {
    try {
        const { class_id, grade, search } = req.query;

        let query = `
            SELECT s.*, c.class_name 
            FROM students s 
            LEFT JOIN classes c ON s.class_id = c.id 
            WHERE 1=1
        `;
        let params = [];
        let filterTitle = 'Semua Siswa';

        if (class_id) {
            query += ' AND s.class_id = ?';
            params.push(class_id);
            const [[c]] = await pool.query('SELECT class_name FROM classes WHERE id = ?', [class_id]);
            if (c) filterTitle = `Kelas ${c.class_name}`;
        } else if (grade && ['X', 'XI', 'XII'].includes(grade.toUpperCase())) {
            query += ' AND c.class_name LIKE ?';
            params.push(`${grade.toUpperCase()}-%`);
            filterTitle = `Angkatan Tingkat ${grade.toUpperCase()}`;
        }

        if (search) {
            query += ' AND (s.name LIKE ? OR s.nipd LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY FIELD(SUBSTRING_INDEX(c.class_name, '-', 1), 'X', 'XI', 'XII'), c.class_name ASC, s.name ASC`;

        const [students] = await pool.query(query, params);

        const wb = XLSX.utils.book_new();

        // Format data untuk sheet master
        const formattedData = students.map((s, idx) => ({
            'No': idx + 1,
            'NIPD': s.nipd || '-',
            'Nama Lengkap Siswa': s.name,
            'Kelas': s.class_name || '-',
            'No HP / WhatsApp Orang Tua': s.parent_phone || '-',
            'Total Poin Pelanggaran': s.total_points || 0,
            'Status Sanksi / Tindakan': getStatusLabel(s.total_points || 0)
        }));

        const wsMaster = XLSX.utils.json_to_sheet(formattedData);
        wsMaster['!cols'] = [
            { wch: 6 },  // No
            { wch: 18 }, // NIPD
            { wch: 32 }, // Nama Siswa
            { wch: 12 }, // Kelas
            { wch: 24 }, // No HP
            { wch: 22 }, // Poin
            { wch: 28 }  // Status Sanksi
        ];
        XLSX.utils.book_append_sheet(wb, wsMaster, 'Data Siswa');

        // Jika mengekspor seluruh angkatan atau seluruh sekolah, buat sheet per-kelas juga agar terorganisir
        if (!class_id && students.length > 0) {
            const classGroups = new Map();
            students.forEach(s => {
                const cName = s.class_name || 'Tanpa Kelas';
                if (!classGroups.has(cName)) classGroups.set(cName, []);
                classGroups.get(cName).push(s);
            });

            classGroups.forEach((groupStudents, cName) => {
                const sheetRows = groupStudents.map((s, idx) => ({
                    'No': idx + 1,
                    'NIPD': s.nipd || '-',
                    'Nama Lengkap Siswa': s.name,
                    'Kelas': s.class_name || '-',
                    'No HP / WhatsApp Orang Tua': s.parent_phone || '-',
                    'Total Poin Pelanggaran': s.total_points || 0,
                    'Status Sanksi': getStatusLabel(s.total_points || 0)
                }));
                const wsClass = XLSX.utils.json_to_sheet(sheetRows);
                wsClass['!cols'] = [
                    { wch: 6 }, { wch: 18 }, { wch: 32 }, { wch: 12 }, { wch: 24 }, { wch: 22 }, { wch: 28 }
                ];
                // Sheet name max 31 chars in Excel
                const safeSheetName = cName.substring(0, 31);
                XLSX.utils.book_append_sheet(wb, wsClass, safeSheetName);
            });
        }

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        const cleanTitle = filterTitle.replace(/[^a-zA-Z0-9_-]/g, '_');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Data_Siswa_${cleanTitle}_${Date.now()}.xlsx"`);
        res.send(buffer);

    } catch (error) {
        console.error('Error in exportExcel:', error);
        res.status(500).json({ success: false, message: 'Gagal mengekspor data siswa: ' + error.message });
    }
};

/**
 * TEMPLATE EXCEL (Mendukung Template Tunggal & Template 1 Angkatan)
 */
exports.downloadTemplate = async (req, res) => {
    try {
        const { type, grade } = req.query; // type='all' | 'angkatan' | 'standard', grade='X' | 'XI' | 'XII' | 'ALL'

        const [classes] = await pool.query(`
            SELECT class_name 
            FROM classes 
            ORDER BY FIELD(SUBSTRING_INDEX(class_name, '-', 1), 'X', 'XI', 'XII'), class_name ASC
        `);

        const wb = XLSX.utils.book_new();

        if (grade === 'ALL' || type === 'all') {
            // Master template dengan seluruh 33 sheet kelas (X-A s/d XII-K)
            for (const c of classes) {
                const sampleRows = [
                    { 'NIPD': '00' + Math.floor(10000000 + Math.random() * 90000000), 'Nama Siswa': `Contoh Siswa 1 ${c.class_name}`, 'Kelas': c.class_name, 'No HP Orang Tua': '081234567890' },
                    { 'NIPD': '00' + Math.floor(10000000 + Math.random() * 90000000), 'Nama Siswa': `Contoh Siswa 2 ${c.class_name}`, 'Kelas': c.class_name, 'No HP Orang Tua': '081234567891' }
                ];
                const ws = XLSX.utils.json_to_sheet(sampleRows);
                ws['!cols'] = [{ wch: 18 }, { wch: 32 }, { wch: 12 }, { wch: 24 }];
                XLSX.utils.book_append_sheet(wb, ws, c.class_name);
            }

            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="Template_Master_Semua_Angkatan_(33_Kelas).xlsx"');
            return res.send(buffer);
        }

        if (type === 'angkatan' || grade) {
            // Buat template 1 angkatan sekaligus dengan 11 Sheet (A s/d K)
            const targetGrade = (grade && ['X', 'XI', 'XII'].includes(grade.toUpperCase())) ? grade.toUpperCase() : 'X';
            const gradeNum = targetGrade === 'X' ? '10' : targetGrade === 'XI' ? '11' : '12';
            const targetClasses = classes.filter(c => c.class_name.startsWith(targetGrade + '-'));

            for (const c of targetClasses) {
                const sampleRows = [
                    { 'NIPD': `${gradeNum}01001`, 'Nama Siswa': `Contoh Siswa 1 ${c.class_name}`, 'Kelas': c.class_name, 'No HP Orang Tua': '081234567890' },
                    { 'NIPD': `${gradeNum}01002`, 'Nama Siswa': `Contoh Siswa 2 ${c.class_name}`, 'Kelas': c.class_name, 'No HP Orang Tua': '081234567891' }
                ];
                const ws = XLSX.utils.json_to_sheet(sampleRows);
                ws['!cols'] = [{ wch: 18 }, { wch: 32 }, { wch: 12 }, { wch: 24 }];
                XLSX.utils.book_append_sheet(wb, ws, c.class_name);
            }

            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="Template_Angkatan_Kelas_${gradeNum}_(${targetGrade}-A_sd_${targetGrade}-K).xlsx"`);
            return res.send(buffer);
        }

        // Default Single Sheet Template
        const sampleData = [
            { 'NIPD': '1001001', 'Nama Siswa': 'Ahmad Fauzi Pratama', 'Kelas': 'X-A', 'No HP Orang Tua': '081234567890' },
            { 'NIPD': '1001002', 'Nama Siswa': 'Budi Santoso', 'Kelas': 'X-B', 'No HP Orang Tua': '081234567891' },
            { 'NIPD': '1101001', 'Nama Siswa': 'Citra Dewi Lestari', 'Kelas': 'XI-A', 'No HP Orang Tua': '081234567892' },
            { 'NIPD': '1201001', 'Nama Siswa': 'Dimas Prayoga', 'Kelas': 'XII-A', 'No HP Orang Tua': '081234567893' }
        ];

        const classReference = classes.map(c => ({ 'Nama Kelas Valid': c.class_name }));

        const wsData = XLSX.utils.json_to_sheet(sampleData);
        const wsClasses = XLSX.utils.json_to_sheet(classReference);

        wsData['!cols'] = [{ wch: 18 }, { wch: 30 }, { wch: 12 }, { wch: 22 }];
        wsClasses['!cols'] = [{ wch: 20 }];

        XLSX.utils.book_append_sheet(wb, wsData, 'Data Siswa');
        XLSX.utils.book_append_sheet(wb, wsClasses, 'Referensi Kelas');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Template_Import_Siswa_Standar.xlsx"');
        res.send(buffer);

    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat template Excel' });
    }
};

exports.deleteStudent = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;

        const [students] = await connection.query('SELECT name, nipd FROM students WHERE id = ?', [id]);
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan' });
        }
        const studentName = students[0].name;

        await connection.beginTransaction();

        // 1. Hapus surat sanksi terkait
        await connection.query('DELETE FROM sanctions_letters WHERE student_id = ?', [id]);

        // 2. Hapus riwayat pelanggaran terkait
        await connection.query('DELETE FROM student_violations WHERE student_id = ?', [id]);

        // 3. Hapus data siswa
        await connection.query('DELETE FROM students WHERE id = ?', [id]);

        await connection.commit();

        res.json({
            success: true,
            message: `Data siswa "${studentName}" berhasil dihapus.`
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error in deleteStudent:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus data siswa: ' + error.message });
    } finally {
        connection.release();
    }
};
