const fs = require('fs');
let code = fs.readFileSync('backend/src/controllers/violationController.js', 'utf8');

const batchDeleteCode = `
exports.batchDelete = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Tidak ada data yang dipilih untuk dihapus' });
        }

        await connection.beginTransaction();

        // Ambil data pelanggaran untuk mengetahui poin yang harus dikembalikan
        const [violations] = await connection.query(\`
            SELECT sv.id, sv.student_id, vc.point_deduction 
            FROM student_violations sv
            JOIN violation_categories vc ON sv.category_id = vc.id
            WHERE sv.id IN (?)\`, [ids]);

        if (violations.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Data pelanggaran tidak ditemukan' });
        }

        // Kelompokkan deduksi poin per siswa
        const studentDeductions = {};
        for (const v of violations) {
            if (!studentDeductions[v.student_id]) studentDeductions[v.student_id] = 0;
            studentDeductions[v.student_id] += v.point_deduction;
        }

        // Update poin setiap siswa
        for (const [studentId, deduction] of Object.entries(studentDeductions)) {
            await connection.query(
                'UPDATE students SET total_points = GREATEST(0, total_points - ?) WHERE id = ?',
                [deduction, studentId]
            );
        }

        // Hapus violations
        await connection.query('DELETE FROM student_violations WHERE id IN (?)', [ids]);

        // Hapus sanksi yang sudah tidak relevan karena poin berkurang
        for (const studentId of Object.keys(studentDeductions)) {
            const [[student]] = await connection.query('SELECT total_points FROM students WHERE id = ?', [studentId]);
            const newTotalPoints = student ? student.total_points : 0;
            
            await connection.query(
                'DELETE FROM sanctions_letters WHERE student_id = ? AND point_threshold > ?',
                [studentId, newTotalPoints]
            );
        }

        await connection.commit();
        res.json({ success: true, message: \`\${violations.length} data pelanggaran berhasil dihapus\` });
    } catch (error) {
        await connection.rollback();
        console.error('Error in batchDelete violations:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus pelanggaran massal' });
    } finally {
        connection.release();
    }
};
`;

fs.appendFileSync('backend/src/controllers/violationController.js', batchDeleteCode);
console.log('batchDelete appended to violationController.js');
