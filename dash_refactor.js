const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');

// 1. Refactor Modal Headers to be super clean
// Remove bg from icons, make icons zinc-700
code = code.replace(/p-2 bg-zinc-900 text-white rounded-xl/g, 'p-2 text-zinc-700');
code = code.replace(/p-2 bg-amber-500 text-white rounded-xl/g, 'p-2 text-zinc-700');
code = code.replace(/p-2 bg-rose-600 text-white rounded-xl/g, 'p-2 text-zinc-700');
code = code.replace(/bg-zinc-100\/80/g, 'bg-white'); // Clean white headers
code = code.replace(/bg-rose-50\/80/g, 'bg-white');

// Change tracking on modal headers
code = code.replace(/text-sm sm:text-lg font-bold text-gray-900 truncate/g, 'text-sm sm:text-lg font-semibold tracking-tight text-zinc-900 truncate');
code = code.replace(/text-sm sm:text-lg font-bold text-zinc-900 truncate/g, 'text-sm sm:text-lg font-semibold tracking-tight text-zinc-900 truncate');

// 2. Refactor empty state typography
code = code.replace(/font-bold text-gray-800 text-sm/g, 'font-medium text-zinc-600 text-sm');
code = code.replace(/font-bold text-zinc-800 text-sm/g, 'font-medium text-zinc-600 text-sm');
code = code.replace(/font-bold text-zinc-900 text-sm/g, 'font-medium text-zinc-600 text-sm');

// 3. Unify "Buka Menu..." buttons to primary minimalist
// We want them to be `bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50`
const newBtnClass = '"px-4 py-2 bg-white border border-zinc-200 text-zinc-800 rounded-lg hover:bg-zinc-50 transition text-xs sm:text-sm font-medium flex items-center gap-1.5 shadow-sm"';
const newSmallBtnClass = '"px-3.5 py-2 bg-white border border-zinc-200 text-zinc-800 rounded-lg hover:bg-zinc-50 transition text-xs sm:text-sm font-medium flex items-center gap-1.5 shadow-sm cursor-pointer"';

code = code.replace(/"px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition text-xs sm:text-sm font-semibold flex items-center gap-1\.5 shadow-sm"/g, newBtnClass);
code = code.replace(/"px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-xs sm:text-sm font-semibold flex items-center gap-1\.5 shadow-sm"/g, newBtnClass);
code = code.replace(/"px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition text-xs sm:text-sm font-semibold flex items-center gap-1\.5 shadow-sm"/g, newBtnClass);

code = code.replace(/"px-3\.5 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition text-xs sm:text-sm font-semibold flex items-center gap-1\.5 shadow-sm cursor-pointer"/g, newSmallBtnClass);


// Rincian Modal Class Filter Buttons:
// Remove the pastel backgrounds on Siswa badge
code = code.replace(/bg-blue-50 text-blue-700 border-blue-200/g, 'bg-zinc-50 text-zinc-600 border-zinc-200');
code = code.replace(/bg-green-50 text-green-700/g, 'bg-zinc-50 text-zinc-500');
code = code.replace(/text-green-700/g, 'text-zinc-500'); // for 0 Siswa

fs.writeFileSync('frontend/src/components/Dashboard.jsx', code);
console.log('Dashboard refactored');
