const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/classes', verifyToken, studentController.getClasses);
router.get('/template-excel', verifyToken, studentController.downloadTemplate);
router.get('/export-excel', verifyToken, studentController.exportExcel);
router.post('/import-excel', verifyToken, authorizeRoles('admin', 'bk', 'piket'), upload.single('file'), studentController.importExcel);
router.post('/', verifyToken, authorizeRoles('admin', 'bk', 'piket'), studentController.create);
router.put('/:id', verifyToken, authorizeRoles('admin', 'bk', 'piket'), studentController.updateStudent);
router.get('/', verifyToken, authorizeRoles('admin', 'bk', 'piket', 'wali_kelas'), studentController.getAll);
router.get('/:id', verifyToken, authorizeRoles('admin', 'bk', 'piket', 'wali_kelas'), studentController.getById);
router.post('/batch-delete', verifyToken, authorizeRoles('admin', 'bk'), studentController.batchDelete);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'bk'), studentController.deleteStudent);

module.exports = router;
