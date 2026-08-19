const pool = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const [[totalStudentsData]] = await pool.query('SELECT COUNT(*) as total FROM students');
        const [[todayViolationsData]] = await pool.query('SELECT COUNT(*) as total FROM student_violations WHERE violation_date = CURDATE()');
        const [[totalViolationsData]] = await pool.query('SELECT COUNT(*) as total FROM student_violations');
        const [[studentsNeedAttentionData]] = await pool.query('SELECT COUNT(*) as total FROM students WHERE total_points >= 21');
        
        // Rincian Pelanggaran Hari Ini
        const [todayViolationsList] = await pool.query(`
            SELECT 
                sv.id, sv.student_id, sv.violation_date, sv.note,
                s.name as student_name, s.nipd, s.total_points as student_total_points,
                c.class_name,
                vc.name as category_name, vc.point_deduction
            FROM student_violations sv
            JOIN students s ON sv.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            JOIN violation_categories vc ON sv.category_id = vc.id
            WHERE sv.violation_date = CURDATE()
            ORDER BY sv.created_at DESC
        `);

        // Rincian Semua Pelanggaran (50 Terkini)
        const [allViolationsList] = await pool.query(`
            SELECT 
                sv.id, sv.student_id, sv.violation_date, sv.note,
                s.name as student_name, s.nipd, s.total_points as student_total_points,
                c.class_name,
                vc.name as category_name, vc.point_deduction
            FROM student_violations sv
            JOIN students s ON sv.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            JOIN violation_categories vc ON sv.category_id = vc.id
            ORDER BY sv.violation_date DESC, sv.created_at DESC
            LIMIT 50
        `);

        // Rincian Siswa Perlu Penanganan (>= 21 Poin)
        const [studentsNeedAttentionList] = await pool.query(`
            SELECT 
                s.id, s.name as student_name, s.nipd, s.total_points,
                c.class_name
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE s.total_points >= 21
            ORDER BY s.total_points DESC
        `);

        // Rincian Distribusi Jumlah Siswa per Kelas
        const [classesSummary] = await pool.query(`
            SELECT 
                c.id, c.class_name, 
                COUNT(s.id) as student_count,
                SUM(CASE WHEN s.total_points > 0 THEN 1 ELSE 0 END) as students_with_violations
            FROM classes c
            LEFT JOIN students s ON s.class_id = c.id
            GROUP BY c.id, c.class_name
            ORDER BY c.class_name ASC
        `);

        // 10 Catatan Pelanggaran Terkini
        const [recentViolations] = await pool.query(`
            SELECT 
                sv.id, sv.student_id, sv.violation_date, sv.status, sv.note,
                s.name as student_name, s.nipd, s.total_points as student_total_points,
                c.class_name,
                vc.name as category_name, vc.point_deduction
            FROM student_violations sv
            JOIN students s ON sv.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            JOIN violation_categories vc ON sv.category_id = vc.id
            ORDER BY sv.created_at DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                totalStudents: totalStudentsData.total,
                todayViolations: todayViolationsData.total,
                totalViolations: totalViolationsData.total,
                studentsNeedAttention: studentsNeedAttentionData.total,
                todayViolationsList,
                allViolationsList,
                studentsNeedAttentionList,
                classesSummary,
                recentViolations
            }
        });
    } catch (error) {
        console.error('Error in getStats:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil statistik dashboard' });
    }
};

