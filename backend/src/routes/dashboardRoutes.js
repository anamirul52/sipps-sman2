const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/stats', verifyToken, authorizeRoles('admin', 'bk', 'piket', 'wali_kelas'), dashboardController.getStats);

module.exports = router;
