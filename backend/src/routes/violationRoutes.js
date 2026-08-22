const express = require('express');
const router = express.Router();
const violationController = require('../controllers/violationController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.post('/', verifyToken, authorizeRoles('admin', 'bk', 'piket'), violationController.create);
router.get('/export', verifyToken, authorizeRoles('admin', 'bk', 'piket', 'wali_kelas'), violationController.exportExcel);
router.get('/', verifyToken, authorizeRoles('admin', 'bk', 'piket', 'wali_kelas'), violationController.getAll);
router.post('/batch-delete', verifyToken, authorizeRoles('admin', 'bk'), violationController.batchDelete);
router.get('/:id', verifyToken, authorizeRoles('admin', 'bk', 'piket', 'wali_kelas'), violationController.getById);
router.put('/:id', verifyToken, authorizeRoles('admin', 'bk', 'piket'), violationController.update);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'bk'), violationController.deleteViolation);

module.exports = router;
