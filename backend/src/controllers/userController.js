const pool = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * GET /api/users
 * Mengambil seluruh data akun pengguna / guru
 * Hanya dapat diakses oleh Super Admin ('admin')
 */
exports.getAll = async (req, res) => {
    try {
        const { search = '', role = '' } = req.query;

        let query = `
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role, 
                u.created_at,
                GROUP_CONCAT(c.id SEPARATOR ',') as assigned_class_id,
                GROUP_CONCAT(c.class_name SEPARATOR ', ') as assigned_class_name
            FROM users u
            LEFT JOIN classes c ON c.homeroom_teacher_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (role) {
            query += ' AND u.role = ?';
            params.push(role);
        }

        query += ` GROUP BY u.id
            ORDER BY 
            FIELD(u.role, 'admin', 'bk', 'wali_kelas', 'piket'), 
            u.name ASC`;

        const [users] = await pool.query(query, params);

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error in userController.getAll:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pengguna' });
    }
};

/**
 * POST /api/users
 * Menambahkan akun guru baru (Guru BK, Guru Piket, Wali Kelas, atau Super Admin)
 */
exports.create = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { name, email, password, role, class_id } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nama, nama pengguna/email, kata sandi, dan role jabatan wajib diisi' 
            });
        }

        const validRoles = ['admin', 'bk', 'piket', 'wali_kelas'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Role harus salah satu dari: Guru BK (bk), Guru Piket (piket), Wali Kelas (wali_kelas), atau Super Admin (admin)' 
            });
        }

        await connection.beginTransaction();

        // Cek duplikasi nama pengguna / email
        const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Nama pengguna/email sudah terdaftar. Gunakan yang lain.' });
        }

        // Hash kata sandi
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert ke tabel users
        const [insertResult] = await connection.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );
        const newUserId = insertResult.insertId;

        // Jika role adalah wali_kelas dan class_id dipilih, tautkan ke tabel classes
        if (role === 'wali_kelas' && class_id) {
            // Reset kelas lama yang mungkin dipegang guru lain
            await connection.query('UPDATE classes SET homeroom_teacher_id = NULL WHERE homeroom_teacher_id = ?', [newUserId]);
            // Tautkan guru ini ke kelas yang dipilih
            await connection.query('UPDATE classes SET homeroom_teacher_id = ? WHERE id = ?', [newUserId, class_id]);
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: `Akun "${name}" sebagai ${getRoleName(role)} berhasil dibuat!`,
            data: {
                id: newUserId,
                name,
                email,
                role
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error in userController.create:', error);
        res.status(500).json({ success: false, message: error.message || 'Gagal menambahkan akun pengguna' });
    } finally {
        connection.release();
    }
};

/**
 * PUT /api/users/:id
 * Mengedit data akun guru / mengubah kata sandi / role / kelas binaan
 */
exports.update = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { name, email, password, role, class_id } = req.body;

        if (!name || !email || !role) {
            return res.status(400).json({ success: false, message: 'Nama, nama pengguna/email, dan role wajib diisi' });
        }

        await connection.beginTransaction();

        // Cek user yang akan diedit
        const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
        }

        // Cek apakah username/email sudah dipakai user lain
        const [duplicateEmail] = await connection.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
        if (duplicateEmail.length > 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Nama pengguna/email sudah digunakan oleh akun lain' });
        }

        // Update profil user
        if (password && password.trim().length > 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await connection.query(
                'UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?',
                [name, email, hashedPassword, role, id]
            );
        } else {
            await connection.query(
                'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
                [name, email, role, id]
            );
        }

        // Kelola tautan wali kelas di tabel classes
        await connection.query('UPDATE classes SET homeroom_teacher_id = NULL WHERE homeroom_teacher_id = ?', [id]);
        if (role === 'wali_kelas' && class_id) {
            await connection.query('UPDATE classes SET homeroom_teacher_id = ? WHERE id = ?', [id, class_id]);
        }

        await connection.commit();

        res.json({
            success: true,
            message: `Data akun "${name}" berhasil diperbarui!`
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error in userController.update:', error);
        res.status(500).json({ success: false, message: error.message || 'Gagal memperbarui data pengguna' });
    } finally {
        connection.release();
    }
};

/**
 * DELETE /api/users/:id
 * Menghapus akun pengguna guru
 */
exports.deleteUser = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;

        // Cegah menghapus akun sendiri
        if (parseInt(id) === parseInt(currentUserId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login!' 
            });
        }

        await connection.beginTransaction();

        const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
        }

        const targetUser = users[0];

        // Lepas relasi wali kelas
        await connection.query('UPDATE classes SET homeroom_teacher_id = NULL WHERE homeroom_teacher_id = ?', [id]);
        
        // Hapus user
        await connection.query('DELETE FROM users WHERE id = ?', [id]);

        await connection.commit();

        res.json({
            success: true,
            message: `Akun "${targetUser.name}" (${getRoleName(targetUser.role)}) berhasil dihapus.`
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error in userController.deleteUser:', error);
        res.status(500).json({ success: false, message: error.message || 'Gagal menghapus akun pengguna' });
    } finally {
        connection.release();
    }
};

function getRoleName(role) {
    switch(role) {
        case 'admin': return 'Super Admin';
        case 'bk': return 'Guru BK';
        case 'piket': return 'Guru Piket';
        case 'wali_kelas': return 'Wali Kelas';
        default: return role;
    }
}
