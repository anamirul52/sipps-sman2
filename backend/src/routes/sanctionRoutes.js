const express = require('express');
const router = express.Router();
const sanctionController = require('../controllers/sanctionController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, authorizeRoles('admin', 'bk'), sanctionController.getAll);
router.get('/:id', verifyToken, authorizeRoles('admin', 'bk'), sanctionController.getById);
router.get('/:id/pdf', verifyToken, authorizeRoles('admin', 'bk'), sanctionController.generatePdf);

module.exports = router;
