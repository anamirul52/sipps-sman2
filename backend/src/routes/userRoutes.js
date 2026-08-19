const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Seluruh rute manajemen pengguna guru dilindungi hanya untuk role 'admin' (Super Admin)
router.use(verifyToken);
router.use(authorizeRoles('admin'));

router.get('/', userController.getAll);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.deleteUser);

module.exports = router;
