const pool = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const [[totalStudentsData]] = await pool.query('SELECT COUNT(*) as total FROM students');
        const [[todayViolationsData]] = await pool.query('SELECT COUNT(*) as total FROM student_violations WHERE violation_date = CURDATE()');
        const [[studentsNeedAttentionData]] = await pool.query('SELECT COUNT(*) as total FROM students WHERE total_points >= 21');
        
        const [recentViolations] = await pool.query(`
            SELECT 
                sv.id, sv.violation_date, sv.status,
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
                studentsNeedAttention: studentsNeedAttentionData.total,
                recentViolations
            }
        });
    } catch (error) {
        console.error('Error in getStats:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil statistik dashboard' });
    }
};
