const fs = require('fs');
const path = require('path');

const targetFiles = [
  'src/components/Dashboard.jsx',
  'src/components/DeleteViolationModal.jsx',
  'src/components/EditViolationModal.jsx',
  'src/components/Layout.jsx',
  'src/components/PointBadge.jsx',
  'src/components/SanctionLetterModal.jsx',
  'src/components/Sidebar.jsx',
  'src/components/ViolationForm.jsx',
  'src/components/ViolationTable.jsx',
  'src/pages/DashboardPage.jsx',
  'src/pages/StudentsPage.jsx',
  'src/pages/UsersPage.jsx',
  'src/pages/ViolationsPage.jsx'
];

const basePath = path.join(__dirname, 'frontend');

targetFiles.forEach(relPath => {
  const filePath = path.join(basePath, relPath);
  if (!fs.existsSync(filePath)) {
    console.log('File not found: ' + filePath);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Unify Grays to Zinc
  content = content.replace(/\bgray-([0-9]+)\b/g, 'zinc-$1');
  content = content.replace(/\bslate-([0-9]+)\b/g, 'zinc-$1');

  // 2. Remove Pastel Icon Backgrounds & Text
  content = content.replace(/\bbg-indigo-50\b/g, 'bg-zinc-100');
  content = content.replace(/\bbg-purple-50\b/g, 'bg-zinc-100');
  content = content.replace(/\bbg-amber-50\b/g, 'bg-zinc-100');
  
  // Replace the colored icons with a subtle zinc text
  content = content.replace(/\btext-indigo-600\b/g, 'text-zinc-600');
  content = content.replace(/\btext-purple-600\b/g, 'text-zinc-600');
  content = content.replace(/\btext-amber-600\b/g, 'text-zinc-600');
  
  content = content.replace(/\btext-indigo-950\b/g, 'text-zinc-900');
  content = content.replace(/\btext-indigo-900\b/g, 'text-zinc-900');
  content = content.replace(/\btext-purple-900\b/g, 'text-zinc-900');

  // 3. Primary Buttons -> Premium Black (Zinc-900)
  content = content.replace(/\bbg-indigo-600\b/g, 'bg-zinc-900');
  content = content.replace(/\bhover:bg-indigo-700\b/g, 'hover:bg-zinc-800');
  content = content.replace(/\bbg-purple-600\b/g, 'bg-zinc-900');
  content = content.replace(/\bhover:bg-purple-700\b/g, 'hover:bg-zinc-800');
  
  content = content.replace(/\bborder-indigo-600\b/g, 'border-zinc-900');
  content = content.replace(/\bborder-purple-600\b/g, 'border-zinc-900');
  content = content.replace(/\bring-indigo-500\b/g, 'ring-zinc-900');
  content = content.replace(/\bring-purple-500\b/g, 'ring-zinc-900');
  content = content.replace(/\bfocus:ring-indigo-500\b/g, 'focus:ring-zinc-900');
  content = content.replace(/\bfocus:ring-purple-500\b/g, 'focus:ring-zinc-900');
  content = content.replace(/\bfocus:border-indigo-500\b/g, 'focus:border-zinc-900');
  content = content.replace(/\bfocus:border-purple-500\b/g, 'focus:border-zinc-900');

  // 4. Remove Bouncy Animations & Heavy Shadows
  content = content.replace(/\bhover:shadow-md\b/g, 'hover:bg-zinc-50'); 
  content = content.replace(/\bhover:shadow-lg\b/g, 'hover:bg-zinc-50');
  content = content.replace(/\bgroup-hover:scale-105\b/g, ''); 
  content = content.replace(/\bshadow-2xl\b/g, 'shadow-xl'); 
  content = content.replace(/\bshadow-md\b/g, 'shadow-sm');
  content = content.replace(/\bshadow-2xs\b/g, 'shadow-sm');

  // 5. Typography refine
  content = content.replace(/text-3xl sm:text-4xl font-semibold/g, 'text-3xl sm:text-4xl font-medium tracking-tight');
  content = content.replace(/text-2xl font-bold/g, 'text-2xl font-semibold tracking-tight');
  content = content.replace(/text-xl font-bold/g, 'text-xl font-semibold tracking-tight');
  
  content = content.replace(/uppercase font-bold text-zinc-500/g, 'uppercase font-semibold text-zinc-500 tracking-wider');
  
  // Specific fix for Dashboard hover animations removing padding issues
  content = content.replace(/group-hover:translate-x-1\b/g, 'group-hover:translate-x-0.5');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + relPath);
});

console.log('UI Sweep completed.');
