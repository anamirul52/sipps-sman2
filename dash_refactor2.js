const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');

// Also remove indigo/amber/red backgrounds from filter buttons in All Violations Modal
code = code.replace(/bg-zinc-100 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/g, 'bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200');
code = code.replace(/bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200/g, 'bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200');
code = code.replace(/bg-zinc-100 text-amber-700 hover:bg-amber-100 border border-amber-200/g, 'bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200');
code = code.replace(/bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200/g, 'bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200');
code = code.replace(/bg-zinc-100 text-rose-700 hover:bg-rose-100 border border-rose-200/g, 'bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200');
code = code.replace(/bg-red-100 text-red-700 hover:bg-red-200 border border-red-200/g, 'bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200');

// Header Icons
code = code.replace(/p-2 bg-zinc-900 text-white rounded-xl flex-shrink-0/g, 'p-1.5 text-zinc-600 flex-shrink-0');
code = code.replace(/p-2 bg-amber-500 text-white rounded-xl/g, 'p-1.5 text-zinc-600');
code = code.replace(/p-2 bg-rose-600 text-white rounded-xl flex-shrink-0/g, 'p-1.5 text-zinc-600 flex-shrink-0');

// Modal headers to clean white
code = code.replace(/bg-zinc-100\/80/g, 'bg-white');
code = code.replace(/bg-rose-50\/80/g, 'bg-white');

fs.writeFileSync('frontend/src/components/Dashboard.jsx', code);
console.log('Fixed filters and headers in Dashboard.');
