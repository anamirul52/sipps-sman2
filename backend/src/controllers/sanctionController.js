const pool = require('../config/db');
const PDFDocument = require('pdfkit');

exports.getAll = async (req, res) => {
    try {
        const [sanctions] = await pool.query(`
            SELECT sl.*, s.name as student_name, s.nipd, s.nipd as nisn, c.class_name
            FROM sanctions_letters sl
            JOIN students s ON sl.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            ORDER BY sl.generated_at DESC
        `);
        res.json({ success: true, data: sanctions });
    } catch (error) {
        console.error('Error in sanction getAll:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data sanksi' });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const [sanctions] = await pool.query(`
            SELECT sl.*, s.name as student_name, s.nipd, s.nipd as nisn, c.class_name
            FROM sanctions_letters sl
            JOIN students s ON sl.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE sl.id = ?
        `, [id]);

        if (sanctions.length === 0) {
            return res.status(404).json({ success: false, message: 'Surat sanksi tidak ditemukan' });
        }
        res.json({ success: true, data: sanctions[0] });
    } catch (error) {
        console.error('Error in sanction getById:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil detail sanksi' });
    }
};

exports.generatePdf = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [sanctions] = await pool.query(`
            SELECT sl.*, s.name as student_name, s.nipd, s.total_points, c.class_name
            FROM sanctions_letters sl
            JOIN students s ON sl.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE sl.id = ?
        `, [id]);

        if (sanctions.length === 0) {
            return res.status(404).json({ success: false, message: 'Surat sanksi tidak ditemukan' });
        }
        const sanction = sanctions[0];

        const [violations] = await pool.query(`
            SELECT sv.violation_date, vc.name as category_name, vc.point_deduction, sv.note
            FROM student_violations sv
            JOIN violation_categories vc ON sv.category_id = vc.id
            WHERE sv.student_id = ?
            ORDER BY sv.violation_date ASC
        `, [sanction.student_id]);

        const doc = new PDFDocument({ margin: 50 });
        const fs = require('fs');
        const path = require('path');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Surat_Sanksi_${sanction.student_name.replace(/ /g, '_')}.pdf"`);
        
        doc.pipe(res);

        // Logo & Kop Surat Resmi
        const logoPath = path.join(__dirname, '../../assets/logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 55 });
        }

        // Header Kop Surat
        doc.fontSize(11).font('Helvetica-Bold').text('PEMERINTAH PROVINSI JAWA TENGAH', 115, 45, { align: 'center' });
        doc.fontSize(11).font('Helvetica-Bold').text('DINAS PENDIDIKAN DAN KEBUDAYAAN', 115, 58, { align: 'center' });
        doc.fontSize(14).font('Helvetica-Bold').text('SMA NEGERI 2 SALATIGA', 115, 71, { align: 'center' });
        doc.fontSize(9).font('Helvetica').text('Jl. Tegalrejo No. 67, Kec. Argomulyo, Kota Salatiga, Jawa Tengah 50733', 115, 87, { align: 'center' });
        doc.fontSize(8).text('Website: sman2salatiga.sch.id | Email: smanegeri2salatiga@gmail.com', 115, 98, { align: 'center' });
        
        // Garis Pembatas Kop Surat
        doc.moveTo(50, 115).lineTo(550, 115).lineWidth(2).stroke();
        doc.moveTo(50, 117.5).lineTo(550, 117.5).lineWidth(0.5).stroke();
        doc.moveDown(3);

        // Judul Surat
        doc.y = 135;
        doc.fontSize(12).font('Helvetica-Bold').text('SURAT PANGGILAN / PEMBERITAHUAN SANKSI SISWA', { align: 'center', underline: true });
        doc.fontSize(10).font('Helvetica').text(`Nomor: 421.3 / BK / ${new Date().getFullYear()}`, { align: 'center' });
        doc.moveDown(1.5);

        // Informasi Siswa
        doc.fontSize(10).font('Helvetica');
        doc.text(`Perihal: ${sanction.status_letter}`);
        doc.moveDown(0.5);
        doc.text('Dengan hormat,');
        doc.text('Sehubungan dengan tata tertib sekolah, kami memberitahukan bahwa siswa dengan data:');
        doc.moveDown(0.5);
        
        const startX = 65;
        doc.text(`Nama Lengkap   : ${sanction.student_name}`, startX);
        doc.text(`NIPD           : ${sanction.nipd || '-'}`, startX);
        doc.text(`Kelas          : ${sanction.class_name || '-'}`, startX);
        doc.text(`Akumulasi Poin : ${sanction.total_points} Poin`, startX);
        doc.text(`Status Sanksi  : ${sanction.status_letter}`, startX);
        doc.moveDown(1);

        doc.text('Telah melakukan catatan pelanggaran tata tertib sekolah sebagai berikut:');
        doc.moveDown(0.5);

        // Tabel Pelanggaran
        let y = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Tanggal', 65, y);
        doc.text('Pelanggaran', 165, y);
        doc.text('Poin', 440, y);
        
        y += 16;
        doc.font('Helvetica');
        violations.forEach(v => {
            const dateStr = new Date(v.violation_date).toLocaleDateString('id-ID');
            doc.text(dateStr, 65, y);
            doc.text(v.category_name, 165, y, { width: 260 });
            doc.text(`+${v.point_deduction} Poin`, 440, y);
            y += 20;
            
            if (y > 680) {
                doc.addPage();
                y = 50;
            }
        });

        doc.y = y + 15;
        doc.text('Sehubungan dengan hal tersebut di atas, kami mengharap kehadiran Bapak/Ibu Orang Tua/Wali Murid untuk hadir ke ruang Bimbingan Konseling (BK) SMA Negeri 2 Salatiga guna koordinasi pembinaan peserta didik.');
        doc.moveDown(2);

        // Tanda tangan
        const signY = doc.y;
        const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        
        doc.text(`Salatiga, ${dateStr}`, 350, signY);
        doc.text('Wali Kelas,', 65, signY + 15);
        doc.text('Guru Bimbingan Konseling (BK),', 350, signY + 15);
        
        doc.text('( _______________________ )', 65, signY + 70);
        doc.text('( _______________________ )', 350, signY + 70);

        doc.text('Mengetahui,', 65, signY + 95, { align: 'center' });
        doc.text('Kepala SMA Negeri 2 Salatiga', 65, signY + 110, { align: 'center' });
        doc.text('( _______________________ )', 65, signY + 165, { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat PDF' });
    }
};
