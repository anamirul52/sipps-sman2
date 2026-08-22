const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/Sidebar.jsx', 'utf8');

code = code.replace(/bg-indigo-900/g, 'bg-zinc-950');
code = code.replace(/border-indigo-800\/80/g, 'border-zinc-800');
code = code.replace(/border-indigo-800/g, 'border-zinc-800');
code = code.replace(/bg-indigo-950\/60/g, 'bg-zinc-950');
code = code.replace(/bg-indigo-950\/40/g, 'bg-zinc-950');
code = code.replace(/text-indigo-300/g, 'text-zinc-400');
code = code.replace(/hover:bg-indigo-800\/60/g, 'hover:bg-zinc-800');
code = code.replace(/hover:bg-indigo-800/g, 'hover:bg-zinc-800');
code = code.replace(/bg-indigo-800/g, 'bg-zinc-800');
code = code.replace(/shadow-indigo-950\/30/g, 'shadow-black/50');
code = code.replace(/text-indigo-200/g, 'text-zinc-400');
code = code.replace(/ring-indigo-400\/40/g, 'ring-zinc-700');

// Make the active font medium instead of semibold for a more refined look
code = code.replace(/font-semibold/g, 'font-medium');

fs.writeFileSync('frontend/src/components/Sidebar.jsx', code);
console.log('Sidebar refined.');
