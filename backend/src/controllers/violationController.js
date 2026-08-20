const pool = require('../config/db');
const XLSX = require('xlsx');

// Kebijakan 7 Jenjang Sanksi Berdasarkan Total Poin
const SANCTION_THRESHOLDS = [
    { 
        points: 11, 
        status: 'Penyelesaian Langsung (11-20 Poin)', 
        officers: 'Wali Kelas', 
        notes: 'Pemberitahuan kepada orang tua/wali' 
    },
    { 
        points: 21, 
        status: 'Peringatan Tertulis I (21-25 Poin)', 
        officers: 'Wali Kelas dan BK', 
        notes: 'Pemanggilan orang tua/wali' 
    },
    { 
        points: 26, 
        status: 'Peringatan Tertulis II (26-50 Poin)', 
        officers: 'Wali Kelas dan BK', 
        notes: 'Pemanggilan orang tua/wali' 
    },
    { 
        points: 51, 
        status: 'Peringatan Tertulis III dan Surat Pernyataan Bermaterai (51-75 Poin)', 
        officers: 'Wali Kelas, BK, Kesiswaan, dan Kepala Sekolah', 
        notes: 'Pemanggilan orang tua/wali' 
    },
    { 
        points: 76, 
        status: 'Pemberian Skorsing (76-99 Poin)', 
        officers: 'Wali Kelas, BK, Kesiswaan, dan Kepala Sekolah', 
        notes: 'Pemanggilan orang tua/wali' 
    },
    { 
        points: 100, 
        status: 'Orang Tua/Wali Menarik Kembali Peserta Didik dari Sekolah (≥100 Poin)', 
        officers: 'Kepala Sekolah', 
        notes: 'Pengembalian siswa kepada orang tua/wali' 
    }
];

exports.create = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { student_id, category_id, category_ids, violation_date, note, photo_proof_url } = req.body;
        const reported_by_teacher_id = req.user.id;

        // Normalisasi category_ids (bisa array atau single ID)
        let selectedCategoryIds = [];
        if (Array.isArray(category_ids) && category_ids.length > 0) {
            selectedCategoryIds = category_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
        } else if (Array.isArray(category_id) && category_id.length > 0) {
            selectedCategoryIds = category_id.map(id => parseInt(id)).filter(id => !isNaN(id));
        } else if (category_id) {
            selectedCategoryIds = [parseInt(category_id)];
        }

        if (!student_id || selectedCategoryIds.length === 0 || !violation_date) {
            return res.status(400).json({ success: false, message: 'student_id, minimal 1 kategori pelanggaran, dan violation_date wajib diisi' });
        }

        await connection.beginTransaction();

        // Ambil info seluruh kategori yang dipilih
        const [categories] = await connection.query(
            'SELECT id, point_deduction, name FROM violation_categories WHERE id IN (?)',
            [selectedCategoryIds]
        );

        if (categories.length === 0) {
            throw new Error('Kategori pelanggaran tidak ditemukan');
        }

        let totalPointDeduction = 0;
        let createdViolationIds = [];
        let categoryNames = [];

        // Insert ke student_violations untuk setiap kategori yang dipilih
        for (const cat of categories) {
            totalPointDeduction += cat.point_deduction;
            categoryNames.push(cat.name);

            const [insertViolation] = await connection.query(
                `INSERT INTO student_violations 
                (student_id, category_id, reported_by_teacher_id, violation_date, note, photo_proof_url, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [student_id, cat.id, reported_by_teacher_id, violation_date, note, photo_proof_url || null]
            );
            createdViolationIds.push(insertViolation.insertId);
        }

        // Update total poin siswa
        await connection.query(
            'UPDATE students SET total_points = total_points + ? WHERE id = ?',
            [totalPointDeduction, student_id]
        );

        // Ambil total poin terbaru
        const [[student]] = await connection.query('SELECT total_points FROM students WHERE id = ?', [student_id]);
        const newTotalPoints = student.total_points;

        let newSanctions = [];

        for (const threshold of SANCTION_THRESHOLDS) {
            if (newTotalPoints >= threshold.points) {
                // Cek apakah surat sanksi untuk threshold ini sudah pernah dibuat
                const [[existingSanction]] = await connection.query(
                    'SELECT id FROM sanctions_letters WHERE student_id = ? AND point_threshold = ?',
                    [student_id, threshold.points]
                );

                if (!existingSanction) {
                    const violationSummary = `Siswa telah mencapai ${newTotalPoints} poin pelanggaran (Ambang Batas: ${threshold.points} Poin). Pelanggaran terbaru: ${categoryNames.join(', ')} (+${totalPointDeduction} poin). Petugas: ${threshold.officers}. Keterangan: ${threshold.notes || '-'}.`;
                    
                    const [insertSanction] = await connection.query(
                        'INSERT INTO sanctions_letters (student_id, violation_summary, point_threshold, status_letter) VALUES (?, ?, ?, ?)',
                        [student_id, violationSummary, threshold.points, threshold.status]
                    );
                    newSanctions.push({ id: insertSanction.insertId, threshold: threshold.points, status: threshold.status, officers: threshold.officers });
                }
            }
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: `${selectedCategoryIds.length} pelanggaran berhasil dicatat (+${totalPointDeduction} poin)`,
            data: {
                violation_ids: createdViolationIds,
                total_point_deduction: totalPointDeduction,
                new_total_points: newTotalPoints,
                sanctions_created: newSanctions
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error in violation create:', error);
        res.status(500).json({ success: false, message: error.message || 'Gagal mencatat pelanggaran' });
    } finally {
        connection.release();
    }
};

exports.getAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { search = '', class_id = '', start_date = '', end_date = '' } = req.query;

        let whereClause = ' WHERE 1=1 ';
        const params = [];
        const countParams = [];

        if (search) {
            whereClause += ' AND (s.name LIKE ? OR s.nipd LIKE ? OR vc.name LIKE ? OR c.class_name LIKE ? OR sv.note LIKE ?)';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
            countParams.push(searchParam, searchParam, searchParam, searchParam, searchParam);
        }

        if (class_id) {
            whereClause += ' AND s.class_id = ?';
            params.push(class_id);
            countParams.push(class_id);
        }

        if (start_date) {
            whereClause += ' AND sv.violation_date >= ?';
            params.push(start_date);
            countParams.push(start_date);
        }

        if (end_date) {
            whereClause += ' AND sv.violation_date <= ?';
            params.push(end_date);
            countParams.push(end_date);
        }

        const query = `
            SELECT 
                sv.*, 
                s.name as student_name, s.nipd, s.nipd as nisn, s.total_points as student_total_points,
                c.class_name,
                vc.name as category_name, vc.point_deduction,
                u.name as reported_by
            FROM student_violations sv
            JOIN students s ON sv.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            JOIN violation_categories vc ON sv.category_id = vc.id
            LEFT JOIN users u ON sv.reported_by_teacher_id = u.id
            ${whereClause}
            ORDER BY sv.violation_date DESC, sv.id DESC
            LIMIT ? OFFSET ?
        `;

        params.push(limit, offset);

        const [violations] = await pool.query(query, params);
        
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM student_violations sv
            JOIN students s ON sv.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            JOIN violation_categories vc ON sv.category_id = vc.id
            ${whereClause}
        `;
        const [[{ total }]] = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: violations,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
        });
    } catch (error) {
        console.error('Error in violation getAll:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pelanggaran' });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const [violations] = await pool.query(`
            SELECT 
                sv.*, 
                s.name as student_name, s.nipd, s.nipd as nisn, s.total_points as student_total_points,
                c.class_name,
                vc.name as category_name, vc.point_deduction,
                u.name as reported_by
            FROM student_violations sv
            JOIN students s ON sv.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            JOIN violation_categories vc ON sv.category_id = vc.id
            LEFT JOIN users u ON sv.reported_by_teacher_id = u.id
            WHERE sv.id = ?
        `, [id]);

        if (violations.length === 0) {
            return res.status(404).json({ success: false, message: 'Pelanggaran tidak ditemukan' });
        }

        res.json({ success: true, data: violations[0] });
    } catch (error) {
        console.error('Error in violation getById:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil detail pelanggaran' });
    }
};

exports.update = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { category_id, violation_date, note, status } = req.body;

        await connection.beginTransaction();

        // 1. Ambil data pelanggaran lama beserta point_deduction lamanya
        const [oldViolations] = await connection.query(`
            SELECT sv.*, vc.point_deduction as old_points
            FROM student_violations sv
            JOIN violation_categories vc ON sv.category_id = vc.id
            WHERE sv.id = ?
        `, [id]);

        if (oldViolations.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Data pelanggaran tidak ditemukan' });
        }

        const oldViolation = oldViolations[0];
        const studentId = oldViolation.student_id;
        const oldPoints = oldViolation.old_points;

        // 2. Ambil point_deduction kategori baru
        const targetCategoryId = category_id || oldViolation.category_id;
        const [newCategories] = await connection.query('SELECT point_deduction, name FROM violation_categories WHERE id = ?', [targetCategoryId]);
        if (newCategories.length === 0) {
            throw new Error('Kategori pelanggaran tidak ditemukan');
        }
        const newPoints = newCategories[0].point_deduction;
        const categoryName = newCategories[0].name;

        // 3. Hitung selisih poin dan update total poin siswa
        const pointDiff = newPoints - oldPoints;
        if (pointDiff !== 0) {
            await connection.query(
                'UPDATE students SET total_points = GREATEST(0, total_points + ?) WHERE id = ?',
                [pointDiff, studentId]
            );
        }

        // 4. Update data student_violations
        await connection.query(
            `UPDATE student_violations 
             SET category_id = ?, violation_date = ?, note = ?, status = ?
             WHERE id = ?`,
            [
                targetCategoryId,
                violation_date || oldViolation.violation_date,
                note !== undefined ? note : oldViolation.note,
                status || oldViolation.status,
                id
            ]
        );

        // 5. Evaluasi ulang sanksi berdasarkan poin terbaru
        const [[student]] = await connection.query('SELECT total_points FROM students WHERE id = ?', [studentId]);
        const currentTotalPoints = student ? student.total_points : 0;

        // Evaluasi threshold
        for (const threshold of SANCTION_THRESHOLDS) {
            if (currentTotalPoints >= threshold.points) {
                const [[existingSanction]] = await connection.query(
                    'SELECT id FROM sanctions_letters WHERE student_id = ? AND point_threshold = ?',
                    [studentId, threshold.points]
                );

                if (!existingSanction) {
                    const violationSummary = `Siswa telah mencapai ${currentTotalPoints} poin pelanggaran (Ambang Batas: ${threshold.points} Poin). Kategori: ${categoryName}. Petugas: ${threshold.officers}. Keterangan: ${threshold.notes || '-'}.`;
                    await connection.query(
                        'INSERT INTO sanctions_letters (student_id, violation_summary, point_threshold, status_letter) VALUES (?, ?, ?, ?)',
                        [studentId, violationSummary, threshold.points, threshold.status]
                    );
                }
            } else {
                // Jika poin berkurang di bawah threshold, bersihkan sanksi yang tidak lagi terpenuhi
                await connection.query(
                    'DELETE FROM sanctions_letters WHERE student_id = ? AND point_threshold = ?',
                    [studentId, threshold.points]
                );
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Data pelanggaran berhasil diperbarui',
            data: {
                id,
                new_total_points: currentTotalPoints
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error in violation update:', error);
        res.status(500).json({ success: false, message: error.message || 'Gagal memperbarui pelanggaran' });
    } finally {
        connection.release();
    }
};

exports.deleteViolation = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;

        await connection.beginTransaction();

        // 1. Ambil data pelanggaran dan poinnya
        const [violations] = await connection.query(`
            SELECT sv.*, vc.point_deduction, s.name as student_name
            FROM student_violations sv
            JOIN violation_categories vc ON sv.category_id = vc.id
            JOIN students s ON sv.student_id = s.id
            WHERE sv.id = ?
        `, [id]);

        if (violations.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Data pelanggaran tidak ditemukan' });
        }

        const violation = violations[0];
        const studentId = violation.student_id;
        const pointDeduction = violation.point_deduction;

        // 2. Kurangi total poin siswa
        await connection.query(
            'UPDATE students SET total_points = GREATEST(0, total_points - ?) WHERE id = ?',
            [pointDeduction, studentId]
        );

        // 3. Hapus record student_violations
        await connection.query('DELETE FROM student_violations WHERE id = ?', [id]);

        // 4. Cek total poin baru siswa & bersihkan sanksi yang tidak lagi valid
        const [[student]] = await connection.query('SELECT total_points FROM students WHERE id = ?', [studentId]);
        const newTotalPoints = student ? student.total_points : 0;

        await connection.query(
            'DELETE FROM sanctions_letters WHERE student_id = ? AND point_threshold > ?',
            [studentId, newTotalPoints]
        );

        await connection.commit();

        res.json({
            success: true,
            message: `Catatan pelanggaran untuk "${violation.student_name}" berhasil dihapus. Poin siswa berkurang ${pointDeduction} poin.`,
            data: {
                deleted_id: id,
                new_total_points: newTotalPoints
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error in violation delete:', error);
        res.status(500).json({ success: false, message: error.message || 'Gagal menghapus pelanggaran' });
    } finally {
        connection.release();
    }
};

exports.getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT * FROM violation_categories ORDER BY point_deduction ASC, name ASC');
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error in getCategories:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil kategori pelanggaran' });
    }
};

/**
 * EXPORT DATA PELANGGARAN SISWA KE EXCEL
 * Mendukung filter search, class_id, grade, date range, dan category
 * Menghasilkan multi-sheet Excel (Riwayat Pelanggaran, Rekap Siswa, Rekap Kelas)
 */
exports.exportExcel = async (req, res) => {
    try {
        const { search = '', class_id = '', grade = '', start_date = '', end_date = '', category_id = '' } = req.query;

        let query = `
            SELECT 
                sv.id,
                sv.violation_date,
                s.nipd,
                s.name as student_name,
                c.class_name,
                vc.name as category_name,
                vc.point_deduction,
                s.total_points as student_total_points,
                u.name as reported_by,
                sv.note
            FROM student_violations sv
            JOIN students s ON sv.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            JOIN violation_categories vc ON sv.category_id = vc.id
            LEFT JOIN users u ON sv.reported_by_teacher_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (s.name LIKE ? OR s.nipd LIKE ? OR vc.name LIKE ? OR c.class_name LIKE ? OR sv.note LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (class_id) {
            query += ' AND s.class_id = ?';
            params.push(class_id);
        }

        if (grade && grade !== 'ALL') {
            query += ' AND c.class_name LIKE ?';
            params.push(`${grade}-%`);
        }

        if (category_id) {
            query += ' AND sv.category_id = ?';
            params.push(category_id);
        }

        if (start_date) {
            query += ' AND sv.violation_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND sv.violation_date <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY sv.violation_date DESC, sv.id DESC';

        const [violations] = await pool.query(query, params);

        const wb = XLSX.utils.book_new();

        // Helper untuk status sanksi resmi
        function getSanctionStatus(points) {
            if (points >= 100) return 'Orang Tua/Wali Menarik Kembali Peserta Didik dari Sekolah (≥100 Poin)';
            if (points >= 76) return 'Pemberian Skorsing (76-99 Poin)';
            if (points >= 51) return 'Peringatan Tertulis III & Surat Pernyataan Bermaterai (51-75 Poin)';
            if (points >= 26) return 'Peringatan Tertulis II (26-50 Poin)';
            if (points >= 21) return 'Peringatan Tertulis I (21-25 Poin)';
            if (points >= 11) return 'Penyelesaian Langsung (11-20 Poin) - Pemberitahuan Ortu';
            return 'Penyelesaian Langsung (0-10 Poin)';
        }

        // Sheet 1: Daftar Riwayat Pelanggaran
        const rowsSheet1 = violations.map((v, i) => ({
            'No': i + 1,
            'Tanggal': v.violation_date ? new Date(v.violation_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-',
            'NIPD': v.nipd || '-',
            'Nama Siswa': v.student_name,
            'Kelas': v.class_name || '-',
            'Bentuk Pelanggaran': v.category_name,
            'Poin': v.point_deduction,
            'Akumulasi Poin Siswa': v.student_total_points,
            'Status Sanksi Terakhir': getSanctionStatus(v.student_total_points),
            'Petugas / Guru Pelapor': v.reported_by || 'Sistem',
            'Catatan / Kronologi': v.note || '-'
        }));

        const ws1 = XLSX.utils.json_to_sheet(rowsSheet1.length > 0 ? rowsSheet1 : [
            { 'No': '-', 'Tanggal': '-', 'NIPD': '-', 'Nama Siswa': 'Belum ada catatan pelanggaran', 'Kelas': '-', 'Bentuk Pelanggaran': '-', 'Poin': 0, 'Akumulasi Poin Siswa': 0, 'Status Sanksi Terakhir': '-', 'Petugas / Guru Pelapor': '-', 'Catatan / Kronologi': '-' }
        ]);
        ws1['!cols'] = [
            { wch: 6 },  // No
            { wch: 14 }, // Tanggal
            { wch: 16 }, // NIPD
            { wch: 30 }, // Nama Siswa
            { wch: 10 }, // Kelas
            { wch: 45 }, // Pelanggaran
            { wch: 8 },  // Poin
            { wch: 20 }, // Akumulasi Poin
            { wch: 45 }, // Status Sanksi
            { wch: 24 }, // Pelapor
            { wch: 40 }  // Catatan
        ];
        XLSX.utils.book_append_sheet(wb, ws1, 'Riwayat Pelanggaran');

        // Sheet 2: Rekap Per Siswa yang Memiliki Catatan
        const [studentRecap] = await pool.query(`
            SELECT 
                s.nipd,
                s.name as student_name,
                c.class_name,
                s.total_points,
                COUNT(sv.id) as total_violations,
                s.parent_phone
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            JOIN student_violations sv ON sv.student_id = s.id
            GROUP BY s.id, s.nipd, s.name, c.class_name, s.total_points, s.parent_phone
            ORDER BY s.total_points DESC, s.name ASC
        `);

        const rowsSheet2 = studentRecap.map((sr, i) => ({
            'Peringkat': i + 1,
            'NIPD': sr.nipd || '-',
            'Nama Siswa': sr.student_name,
            'Kelas': sr.class_name || '-',
            'Total Kasus': parseInt(sr.total_violations, 10) || 0,
            'Total Akumulasi Poin': parseInt(sr.total_points, 10) || 0,
            'Status Penanganan / Sanksi': getSanctionStatus(parseInt(sr.total_points, 10) || 0),
            'No HP Orang Tua': sr.parent_phone || '-'
        }));

        const ws2 = XLSX.utils.json_to_sheet(rowsSheet2.length > 0 ? rowsSheet2 : [
            { 'Peringkat': '-', 'NIPD': '-', 'Nama Siswa': 'Belum ada siswa dengan catatan pelanggaran', 'Kelas': '-', 'Total Kasus': 0, 'Total Akumulasi Poin': 0, 'Status Penanganan / Sanksi': '-', 'No HP Orang Tua': '-' }
        ]);
        ws2['!cols'] = [
            { wch: 10 }, { wch: 16 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 45 }, { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(wb, ws2, 'Rekap Siswa Terpanggil');

        // Sheet 3: Rekap Per Kelas
        const [classRecap] = await pool.query(`
            SELECT 
                c.class_name,
                COUNT(sv.id) as violation_count,
                COALESCE(SUM(vc.point_deduction), 0) as total_class_points,
                COUNT(DISTINCT s.id) as students_involved
            FROM classes c
            LEFT JOIN students s ON s.class_id = c.id
            LEFT JOIN student_violations sv ON sv.student_id = s.id
            LEFT JOIN violation_categories vc ON sv.category_id = vc.id
            GROUP BY c.id, c.class_name
            ORDER BY 
                CASE 
                    WHEN c.class_name LIKE 'X-%' THEN 1 
                    WHEN c.class_name LIKE 'XI-%' THEN 2 
                    WHEN c.class_name LIKE 'XII-%' THEN 3 
                    ELSE 4 
                END, 
                c.class_name ASC
        `);

        const rowsSheet3 = classRecap.map((cr, i) => ({
            'No': i + 1,
            'Kelas': cr.class_name,
            'Jumlah Kasus Pelanggaran': parseInt(cr.violation_count, 10) || 0,
            'Total Poin Pelanggaran': parseInt(cr.total_class_points, 10) || 0,
            'Jumlah Siswa Terlibat': parseInt(cr.students_involved, 10) || 0
        }));

        const ws3 = XLSX.utils.json_to_sheet(rowsSheet3);
        ws3['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 24 }, { wch: 24 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, ws3, 'Rekap Per Kelas');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        const dateStr = new Date().toISOString().split('T')[0];

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Laporan_Pelanggaran_Siswa_SMAN2_${dateStr}.xlsx"`);
        res.setHeader('Content-Length', buffer.length);
        return res.end(buffer);

    } catch (error) {
        console.error('Error in exportExcel violations:', error);
        res.status(500).json({ success: false, message: 'Gagal mengekspor data pelanggaran: ' + error.message });
    }
};
