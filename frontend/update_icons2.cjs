const fs = require('fs');


const files = [
  'src/components/Sidebar.jsx',
  'src/components/Layout.jsx',
  'src/pages/LoginPage.jsx',
  'src/pages/StudentsPage.jsx',
  'src/pages/ViolationsPage.jsx',
  'src/components/DeleteViolationModal.jsx',
  'src/components/EditViolationModal.jsx',
  'src/components/SanctionLetterModal.jsx',
  'src/components/PointBadge.jsx',
  'src/components/ViolationTable.jsx',
];

const map = {
  HiHome: 'Home',
  HiExclamationCircle: 'AlertCircle',
  HiUsers: 'Users',
  HiUserGroup: 'Users',
  HiX: 'X',
  HiOutlineLogout: 'LogOut',
  HiMenuAlt2: 'Menu',
  HiOutlineUser: 'User',
  HiOutlineLockClosed: 'Lock',
  HiTrash: 'Trash2',
  HiExclamation: 'AlertTriangle',
  HiPencilAlt: 'Edit',
  HiOutlineExclamationCircle: 'Info',
  HiDownload: 'Download',
  HiOutlineDocumentText: 'FileText',
  HiShieldExclamation: 'ShieldAlert',
  HiArrowRight: 'ArrowRight',
  HiArrowLeft: 'ArrowLeft',
  HiSearch: 'Search',
  HiOutlineEye: 'Eye',
  HiDocumentDownload: 'FileDown',
  HiFilter: 'Filter',
  HiShieldCheck: 'ShieldCheck',
  HiClipboardList: 'ClipboardList',
  HiCheck: 'Check',
  HiCheckCircle: 'CheckCircle',
  HiChevronDown: 'ChevronDown',
  HiChevronLeft: 'ChevronLeft',
  HiChevronRight: 'ChevronRight'
};

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let f = fs.readFileSync(file, 'utf8');
  
  // replace imports
  f = f.replace(/import\s*{([^}]+)}\s*from\s*'react-icons\/hi';/g, (match, imports) => {
    let newImports = imports.split(',').map(i => i.trim()).map(i => map[i] || i);
    // filter out duplicates and undefined
    newImports = [...new Set(newImports.filter(Boolean))];
    return `import { ${newImports.join(', ')} } from 'lucide-react';`;
  });

  for (const [k, v] of Object.entries(map)) {
    // Replace <HiIcon with <LucideIcon
    f = f.replaceAll(`<${k}`, `<${v}`);
    f = f.replaceAll(`</${k}`, `</${v}`);
  }
  
  fs.writeFileSync(file, f);
});

console.log('Icons updated successfully in multiple files.');
