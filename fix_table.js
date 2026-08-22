const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');

code = code.replace(/<div className="hidden sm:block overflow-hidden border border-zinc-200 rounded-xl shadow-sm">/g, '<div className="hidden sm:block overflow-x-auto border border-zinc-200 rounded-xl shadow-sm bg-white">');
code = code.replace(/<table className="w-full text-left border-collapse text-xs table-fixed">/g, '<table className="w-full text-left border-collapse text-xs min-w-[950px]">');

fs.writeFileSync('frontend/src/components/Dashboard.jsx', code);
console.log('Fixed table overflows');
