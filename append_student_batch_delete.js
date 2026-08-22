const fs = require('fs');

// 1. Append batchDelete to studentController.js
const controllerPath = 'backend/src/controllers/studentController.js';
let controllerCode = fs.readFileSync(controllerPath, 'utf8');

const batchDeleteCode = `
exports.batchDelete = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Tidak ada data siswa yang dipilih untuk dihapus' });
        }

        await connection.beginTransaction();

        // 1. Hapus surat sanksi terkait
        await connection.query('DELETE FROM sanctions_letters WHERE student_id IN (?)', [ids]);

        // 2. Hapus riwayat pelanggaran terkait
        await connection.query('DELETE FROM student_violations WHERE student_id IN (?)', [ids]);

        // 3. Hapus data siswa
        await connection.query('DELETE FROM students WHERE id IN (?)', [ids]);

        await connection.commit();
        res.json({ success: true, message: \`\${ids.length} data siswa beserta riwayatnya berhasil dihapus\` });
    } catch (error) {
        await connection.rollback();
        console.error('Error in batchDelete students:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus data siswa massal' });
    } finally {
        connection.release();
    }
};
`;
fs.appendFileSync(controllerPath, batchDeleteCode);
console.log('batchDelete appended to studentController.js');

// 2. Add route to studentRoutes.js
const routesPath = 'backend/src/routes/studentRoutes.js';
let routesCode = fs.readFileSync(routesPath, 'utf8');
routesCode = routesCode.replace(
    "router.delete('/:id', verifyToken, authorizeRoles('admin', 'bk'), studentController.deleteStudent);",
    "router.post('/batch-delete', verifyToken, authorizeRoles('admin', 'bk'), studentController.batchDelete);\nrouter.delete('/:id', verifyToken, authorizeRoles('admin', 'bk'), studentController.deleteStudent);"
);
fs.writeFileSync(routesPath, routesCode);
console.log('batch-delete route added to studentRoutes.js');
