const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');

// The marker to find the correct modal
const modalStart = code.indexOf('Rincian Pelanggaran Masuk Hari Ini');
if (modalStart === -1) {
    console.error("Modal not found");
    process.exit(1);
}

// Find the end of this modal (let's say the next "Modal Content" or end of the JSX block)
const nextModal = code.indexOf('Rincian Data Siswa & Rombel', modalStart);
const chunk = code.substring(modalStart, nextModal);

// 1. Remove Desktop 'Aksi' Column Header
let newChunk = chunk.replace(/<th className="px-2 py-3 text-center w-20">Aksi<\/th>/, '');

// 2. Remove Desktop 'Aksi' Column Button
const buttonRegex = /<td className="px-2 py-3 text-center whitespace-nowrap">\s*<button[\s\S]*?onClick=\{\(\) => setSelectedStudentForSanction\(v\.student_id\)\}[\s\S]*?<\/button>\s*<\/td>/;
newChunk = newChunk.replace(buttonRegex, '');

// 3. Remove Mobile 'Aksi' Button
const mobileButtonRegex = /<div className="pt-1">\s*<button[\s\S]*?onClick=\{\(\) => setSelectedStudentForSanction\(v\.student_id\)\}[\s\S]*?Lihat Surat Sanksi[\s\S]*?<\/button>\s*<\/div>/;
newChunk = newChunk.replace(mobileButtonRegex, '');

code = code.substring(0, modalStart) + newChunk + code.substring(nextModal);
fs.writeFileSync('frontend/src/components/Dashboard.jsx', code);
console.log('Aksi column removed from Rincian Pelanggaran Masuk Hari Ini.');
