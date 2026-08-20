const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        res.status(201).json({ success: true, message: 'Registrasi berhasil', data: { id: result.insertId } });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
        }
        console.error('Error in register:', error);
        res.status(500).json({ success: false, message: 'Gagal melakukan registrasi' });
    }
};

exports.login = async (req, res) => {
    try {
        const identifier = req.body.username || req.body.email;
        const { password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: 'Nama pengguna/email dan password wajib diisi' });
        }

        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ? OR name = ?',
            [identifier, identifier]
        );
        const user = users[0];

        if (!user) {
            return res.status(401).json({ success: false, message: 'Nama pengguna atau password salah' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Nama pengguna atau password salah' });
        }

        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        const secret = process.env.JWT_SECRET || 'smanda02_salatiga_super_secret_jwt_key_2026';
        const token = jwt.sign(payload, secret, { expiresIn: '24h' });

        res.json({
            success: true,
            message: 'Login berhasil',
            token,
            user: payload
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ success: false, message: 'Gagal melakukan login' });
    }
};
