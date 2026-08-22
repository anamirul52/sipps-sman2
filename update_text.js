const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');

code = code.replace(
  '<p className="text-slate-500 font-medium text-xs sm:text-sm">Pelanggaran Hari Ini</p>',
  '<p className="text-slate-500 font-medium text-xs sm:text-sm">Siswa melanggar hari ini</p>'
);

// Actually, the user asked for "Siswa yang melanggar hari ini" and "Total siswa yang melanggar"
code = code.replace(
  '<p className="text-slate-500 font-medium text-xs sm:text-sm">Siswa melanggar hari ini</p>', // Fallback if ran twice
  '<p className="text-slate-500 font-medium text-xs sm:text-sm">Siswa yang melanggar hari ini</p>'
);

code = code.replace(
  '<p className="text-slate-500 font-medium text-xs sm:text-sm">Pelanggaran Hari Ini</p>',
  '<p className="text-slate-500 font-medium text-xs sm:text-sm">Siswa yang melanggar hari ini</p>'
);

code = code.replace(
  '<p className="text-slate-500 font-medium text-xs sm:text-sm">Semua Pelanggaran</p>',
  '<p className="text-slate-500 font-medium text-xs sm:text-sm">Total siswa yang melanggar</p>'
);

fs.writeFileSync('frontend/src/components/Dashboard.jsx', code);
console.log('Text changed');
