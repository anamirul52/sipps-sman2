const pool = require('../config/db');

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
        status: 'Peringatan Tertulis III dan Surat Pernyataan Bermeterai (51-75 Poin)', 
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
        const { student_id, category_id, violation_date, note, photo_proof_url } = req.body;
        const reported_by_teacher_id = req.user.id;

        if (!student_id || !category_id || !violation_date) {
            return res.status(400).json({ success: false, message: 'student_id, category_id, dan violation_date wajib diisi' });
        }

        await connection.beginTransaction();

        // Ambil info kategori (untuk point deduction)
        const [categories] = await connection.query('SELECT point_deduction, name FROM violation_categories WHERE id = ?', [category_id]);
        if (categories.length === 0) {
            throw new Error('Kategori pelanggaran tidak ditemukan');
        }
        const pointDeduction = categories[0].point_deduction;
        const categoryName = categories[0].name;

        // Insert ke student_violations
        const [insertViolation] = await connection.query(
            `INSERT INTO student_violations 
            (student_id, category_id, reported_by_teacher_id, violation_date, note, photo_proof_url, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [student_id, category_id, reported_by_teacher_id, violation_date, note, photo_proof_url || null]
        );
        const violationId = insertViolation.insertId;

        // Update total poin siswa
        await connection.query(
            'UPDATE students SET total_points = total_points + ? WHERE id = ?',
            [pointDeduction, student_id]
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
                    const violationSummary = `Siswa telah mencapai ${newTotalPoints} poin pelanggaran (Ambang Batas: ${threshold.points} Poin). Pelanggaran terbaru: ${categoryName} (+${pointDeduction} poin). Petugas: ${threshold.officers}. Keterangan: ${threshold.notes || '-'}.`;
                    
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
            message: 'Pelanggaran berhasil dicatat',
            data: {
                violation_id: violationId,
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
            ORDER BY sv.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [violations] = await pool.query(query, [limit, offset]);
        const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM student_violations');

        res.json({
            success: true,
            data: violations,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
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
