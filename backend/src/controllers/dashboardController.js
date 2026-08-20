const pool = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        // Jalankan seluruh query statistik secara paralel dengan Promise.all
        const [
            [[totalStudentsData]],
            [[todayViolationsData]],
            [[totalViolationsData]],
            [[studentsNeedAttentionData]],
            [todayViolationsList],
            [allViolationsList],
            [studentsNeedAttentionList],
            [classesSummary],
            [recentViolations]
        ] = await Promise.all([
            // 1. Total Students
            pool.query('SELECT COUNT(*) as total FROM students'),
            
            // 2. Today Violations Count
            pool.query('SELECT COUNT(*) as total FROM student_violations WHERE violation_date = CURDATE()'),
            
            // 3. Total Violations Count
            pool.query('SELECT COUNT(*) as total FROM student_violations'),
            
            // 4. Students Need Attention Count
            pool.query('SELECT COUNT(*) as total FROM students WHERE total_points >= 21'),
            
            // 5. Today Violations List
            pool.query(`
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
            `),
            
            // 6. All Violations List
            pool.query(`
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
            `),
            
            // 7. Students Need Attention List
            pool.query(`
                SELECT 
                    s.id, s.name as student_name, s.nipd, s.total_points,
                    c.class_name
                FROM students s
                LEFT JOIN classes c ON s.class_id = c.id
                WHERE s.total_points >= 21
                ORDER BY s.total_points DESC
            `),
            
            // 8. Classes Summary
            pool.query(`
                SELECT 
                    c.id, c.class_name, 
                    COUNT(s.id) as student_count,
                    SUM(CASE WHEN s.total_points > 0 THEN 1 ELSE 0 END) as students_with_violations
                FROM classes c
                LEFT JOIN students s ON s.class_id = c.id
                GROUP BY c.id, c.class_name
                ORDER BY c.class_name ASC
            `),
            
            // 9. 10 Recent Violations
            pool.query(`
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
            `)
        ]);

        res.json({
            success: true,
            data: {
                totalStudents: parseInt(totalStudentsData?.total, 10) || 0,
                todayViolations: parseInt(todayViolationsData?.total, 10) || 0,
                totalViolations: parseInt(totalViolationsData?.total, 10) || 0,
                studentsNeedAttention: parseInt(studentsNeedAttentionData?.total, 10) || 0,
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

