const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Endpoint registrasi publik dimatikan demi keamanan (pembuatan akun guru dilakukan oleh Super Admin di menu Manajemen Akun)
// router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
