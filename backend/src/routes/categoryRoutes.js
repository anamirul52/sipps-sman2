const express = require('express');
const router = express.Router();
const violationController = require('../controllers/violationController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, violationController.getCategories);

module.exports = router;
