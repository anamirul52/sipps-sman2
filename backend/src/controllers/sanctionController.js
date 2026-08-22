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

        const doc = new PDFDocument({ 
            size: 'A4',
            margins: { top: 35, bottom: 35, left: 50, right: 50 }
        });
        const fs = require('fs');
        const path = require('path');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Surat_Sanksi_${sanction.student_name.replace(/[^a-zA-Z0-9_]/g, '_')}.pdf"`);
        
        doc.pipe(res);
        doc.fillColor('#000000').strokeColor('#000000');

        // ================= KOP SURAT RESMI =================
        const logoPath = path.join(__dirname, '../../assets/logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 32, { width: 52 });
        }

        // Teks Kop Surat (Center & Black)
        const kopX = 105;
        const kopW = 440;
        doc.fontSize(11).font('Helvetica-Bold').text('PEMERINTAH PROVINSI JAWA TENGAH', kopX, 28, { align: 'center', width: kopW });
        doc.fontSize(11).font('Helvetica-Bold').text('DINAS PENDIDIKAN DAN KEBUDAYAAN', kopX, 42, { align: 'center', width: kopW });
        doc.fontSize(14).font('Helvetica-Bold').text('SEKOLAH MENENGAH ATAS NEGERI 2 SALATIGA', kopX, 56, { align: 'center', width: kopW });
        doc.fontSize(8.5).font('Helvetica').text('Jalan Tegalrejo Nomor 79, Argomulyo, Kota Salatiga, Jawa Tengah 50733', kopX, 74, { align: 'center', width: kopW });
        doc.fontSize(8).font('Helvetica').text('Website: sma2salatiga.sch.id | Email: sma2salatiga@gmail.com', kopX, 86, { align: 'center', width: kopW });
        
        // Garis Pembatas Kop Surat
        doc.moveTo(50, 100).lineTo(545, 100).lineWidth(1.8).stroke();
        doc.moveTo(50, 102.5).lineTo(545, 102.5).lineWidth(0.5).stroke();

        // ================= JUDUL & NOMOR SURAT =================
        doc.y = 112;
        const currentYear = new Date().getFullYear();
        const fullDateStr = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        doc.fontSize(11).font('Helvetica-Bold').text('SURAT PEMBERITAHUAN PELANGGARAN TATA TERTIB', { align: 'center', underline: true });
        doc.fontSize(9.5).font('Helvetica').text(`Nomor: 421.3 / ${sanction.id.toString().padStart(3, '0')} / BK / ${currentYear}`, { align: 'center' });
        doc.moveDown(0.9);

        // ================= TUJUAN SURAT & TANGGAL =================
        const topY = doc.y;
        doc.fontSize(9.5).font('Helvetica').text(`Salatiga, ${fullDateStr}`, 350, topY, { align: 'right', width: 195 });
        
        doc.text('Yth. Orang Tua / Wali Peserta Didik dari:', 50, topY);
        doc.font('Helvetica');
        
        // Jeda vertikal yang lebih lega sebelum data siswa
        doc.y = topY + 18;

        const bioItems = [
            { label: 'Nama Peserta Didik', val: sanction.student_name },
            { label: 'NIPD / NISN', val: sanction.nipd || '-' },
            { label: 'Kelas', val: sanction.class_name || '-' },
            { label: 'Akumulasi Poin', val: `${sanction.total_points} Poin` },
            { label: 'Status Tindakan', val: sanction.status_letter }
        ];

        bioItems.forEach(item => {
            const lineY = doc.y;
            doc.font('Helvetica-Bold').text(item.label, 65, lineY);
            doc.font('Helvetica').text(`:  ${item.val}`, 175, lineY);
            doc.y = lineY + 17.5;
        });

        doc.y += 4;
        doc.font('Helvetica').text('di tempat', 50, doc.y);
        doc.moveDown(1.0);


        // ================= ISI SURAT (SPASI 1,5 LEGA) =================
        doc.text('Dengan hormat,', 50);
        doc.moveDown(0.5);

        const introText = `Sehubungan dengan pelaksanaan tata tertib sekolah serta upaya pembinaan kedisiplinan dan pembentukan karakter peserta didik di SMA Negeri 2 Salatiga, bersama ini kami sampaikan bahwa peserta didik tersebut di atas telah mencapai akumulasi ${sanction.total_points} poin pelanggaran.`;
        doc.text(introText, 50, doc.y, { width: 495, align: 'justify', lineGap: 5.5 });
        doc.moveDown(0.7);

        doc.text('Adapun rincian catatan pelanggaran yang telah dilakukan adalah sebagai berikut:', 50);
        doc.moveDown(0.5);

        // ================= TABEL RINCIAN PELANGGARAN =================
        const tblX = 50;
        const tblW = 495;
        const colW = { no: 25, date: 70, cat: 185, point: 45, note: 170 };
        const hdrH = 20;
        let curY = doc.y;

        // Header Tabel
        doc.rect(tblX, curY, tblW, hdrH).lineWidth(0.8).stroke();
        doc.font('Helvetica-Bold').fontSize(8.5);
        doc.text('No', tblX, curY + 6, { width: colW.no, align: 'center' });
        doc.text('Tanggal', tblX + colW.no, curY + 6, { width: colW.date, align: 'center' });
        doc.text('Bentuk Pelanggaran', tblX + colW.no + colW.date + 4, curY + 6, { width: colW.cat - 8 });
        doc.text('Poin', tblX + colW.no + colW.date + colW.cat, curY + 6, { width: colW.point, align: 'center' });
        doc.text('Catatan / Kronologi', tblX + colW.no + colW.date + colW.cat + colW.point + 4, curY + 6, { width: colW.note - 8 });

        curY += hdrH;
        doc.font('Helvetica').fontSize(8);

        if (violations.length === 0) {
            doc.rect(tblX, curY, tblW, 20).lineWidth(0.5).stroke();
            doc.text('Belum ada rincian pelanggaran yang tercatat', tblX, curY + 6, { width: tblW, align: 'center' });
            curY += 20;
        } else {
            violations.forEach((v, idx) => {
                const dStr = new Date(v.violation_date).toLocaleDateString('id-ID');
                const cStr = v.category_name || '-';
                const pStr = `+${v.point_deduction}`;
                const nStr = v.note || '-';

                const catHeight = doc.heightOfString(cStr, { width: colW.cat - 8 });
                const noteHeight = doc.heightOfString(nStr, { width: colW.note - 8 });
                const rowH = Math.max(22, Math.max(catHeight, noteHeight) + 8);

                doc.rect(tblX, curY, tblW, rowH).lineWidth(0.5).stroke();
                doc.text((idx + 1).toString(), tblX, curY + 6, { width: colW.no, align: 'center' });
                doc.text(dStr, tblX + colW.no, curY + 6, { width: colW.date, align: 'center' });
                doc.text(cStr, tblX + colW.no + colW.date + 4, curY + 6, { width: colW.cat - 8, height: rowH - 6 });
                doc.text(pStr, tblX + colW.no + colW.date + colW.cat, curY + 6, { width: colW.point, align: 'center' });
                doc.text(nStr, tblX + colW.no + colW.date + colW.cat + colW.point + 4, curY + 6, { width: colW.note - 8, height: rowH - 6 });

                curY += rowH;

                if (curY > 700) {
                    doc.addPage();
                    curY = 45;
                }
            });
        }

        // ================= UNDANGAN & TINDAK LANJUT (SPASI 1,5) =================
        doc.y = curY;
        doc.moveDown(0.9);

        doc.fontSize(9.5).font('Helvetica');
        const inviteText = 'Guna menindaklanjuti hal tersebut dalam rangka pembinaan dan penyelesaian bersama, kami mengharap kehadiran Bapak/Ibu Orang Tua/Wali pada:';
        doc.text(inviteText, 50, doc.y, { width: 495, align: 'justify', lineGap: 5.5 });
        doc.moveDown(0.6);

        const inviteDetails = [
            { label: 'Tempat', val: 'Ruang Bimbingan dan Konseling SMA Negeri 2 Salatiga' },
            { label: 'Waktu', val: 'Pukul 08.00 s.d. 14.00 WIB (Pada jam kerja dinas)' },
            { label: 'Keperluan', val: 'Pembinaan dan penanganan sanksi pelanggaran tata tertib peserta didik' }
        ];

        inviteDetails.forEach(item => {
            const lineY = doc.y;
            doc.font('Helvetica-Bold').text(item.label, 65, lineY);
            doc.font('Helvetica').text(`:  ${item.val}`, 145, lineY, { width: 395 });
            doc.y = lineY + 16.5;
        });

        doc.moveDown(0.8);
        doc.text('Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.', 50, doc.y, { width: 495, align: 'justify', lineGap: 5.5 });
        doc.moveDown(1.2);

        // ================= TANDA TANGAN =================
        const signY = doc.y;
        const leftX = 50;
        const rightX = 350;

        doc.font('Helvetica').fontSize(9.5);
        doc.text('Wali Kelas,', leftX, signY, { align: 'center', width: 150 });
        doc.text('Guru Bimbingan dan Konseling,', rightX, signY, { align: 'center', width: 160 });

        doc.text('( _______________________ )', leftX, signY + 45, { align: 'center', width: 150 });
        doc.text('( _______________________ )', rightX, signY + 45, { align: 'center', width: 160 });

        // Mengetahui Kepala Sekolah
        const chiefY = signY + 60;
        doc.text('Mengetahui,', 50, chiefY, { align: 'center', width: 495 });
        doc.text('Kepala SMA Negeri 2 Salatiga', 50, chiefY + 12, { align: 'center', width: 495 });
        doc.text('( ____________________________________ )', 50, chiefY + 50, { align: 'center', width: 495 });

        doc.end();






    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat PDF' });
    }
};


