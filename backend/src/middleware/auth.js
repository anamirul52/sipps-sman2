const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
        }

        const secret = process.env.JWT_SECRET || 'smanda02_salatiga_super_secret_jwt_key_2026';
        const decoded = jwt.verify(token, secret);
        req.user = decoded; // Attach user to request
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa.' });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Akses ditolak. Anda tidak memiliki izin untuk mengakses resource ini.' });
        }
        next();
    };
};

module.exports = { verifyToken, authorizeRoles };
