const pool = require('../config/db');

exports.getStats = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();

        // Tanggal hari ini presisi zona waktu Indonesia Barat (WIB / Asia/Jakarta)
        const todayWIB = new Intl.DateTimeFormat('en-CA', { 
            timeZone: 'Asia/Jakarta', 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        }).format(new Date());

        // 1. Single aggregated count query (4 counts in 1 instant query)
        const [countsData] = await conn.query(`
            SELECT 
                (SELECT COUNT(*) FROM students) as total_students,
                (SELECT COUNT(*) FROM student_violations WHERE violation_date = ?) as today_violations,
                (SELECT COUNT(*) FROM student_violations) as total_violations,
                (SELECT COUNT(*) FROM students WHERE total_points >= 21) as students_need_attention
        `, [todayWIB]);

        const statsRow = countsData[0] || {};

        // 2. Rincian Pelanggaran Hari Ini (Sesuai tanggal hari ini WIB)
        const [todayViolationsList] = await conn.query(`
            SELECT 
                sv.id, sv.student_id, sv.violation_date, sv.note,
                s.name as student_name, s.nipd, s.total_points as student_total_points,
                c.class_name,
                vc.name as category_name, vc.point_deduction
            FROM student_violations sv
            JOIN students s ON sv.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            JOIN violation_categories vc ON sv.category_id = vc.id
            WHERE sv.violation_date = ?
            ORDER BY sv.created_at DESC
        `, [todayWIB]);

        // 3. Rincian Semua Pelanggaran
        const [allViolationsList] = await conn.query(`
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
        `);

        // 4. Rincian Siswa Perlu Penanganan (>= 21 Poin)
        const [studentsNeedAttentionList] = await conn.query(`
            SELECT 
                s.id, s.name as student_name, s.nipd, s.total_points,
                c.class_name
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE s.total_points >= 21
            ORDER BY s.total_points DESC
        `);

        // 5. Rincian Distribusi Jumlah Siswa per Kelas
        const [classesSummary] = await conn.query(`
            SELECT 
                c.id, c.class_name, 
                COUNT(s.id) as student_count,
                SUM(CASE WHEN s.total_points > 0 THEN 1 ELSE 0 END) as students_with_violations
            FROM classes c
            LEFT JOIN students s ON s.class_id = c.id
            GROUP BY c.id, c.class_name
            ORDER BY c.class_name ASC
        `);

        // 6. 10 Catatan Pelanggaran Terkini
        const [recentViolations] = await conn.query(`
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
                totalStudents: parseInt(statsRow.total_students, 10) || 0,
                todayViolations: parseInt(statsRow.today_violations, 10) || 0,
                totalViolations: parseInt(statsRow.total_violations, 10) || 0,
                studentsNeedAttention: parseInt(statsRow.students_need_attention, 10) || 0,
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
    } finally {
        if (conn) conn.release();
    }
};

