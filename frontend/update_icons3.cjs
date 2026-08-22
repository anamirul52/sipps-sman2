const fs = require('fs');

const map = {
  HiAcademicCap: 'GraduationCap',
  HiDocumentReport: 'FileSpreadsheet',
  HiUpload: 'Upload',
  HiPlus: 'Plus',
  HiUserAdd: 'UserPlus',
  HiPhone: 'Phone',
  HiSparkles: 'Sparkles',
  HiDocumentText: 'FileText',
  HiOutlinePencilAlt: 'Edit',
  HiPencilAlt: 'Edit',
  HiOutlineTrash: 'Trash2',
  HiTrash: 'Trash2',
  HiRefresh: 'RefreshCw',
  HiCheck: 'Check',
  HiCheckCircle: 'CheckCircle',
  HiChevronDown: 'ChevronDown',
  HiChevronLeft: 'ChevronLeft',
  HiChevronRight: 'ChevronRight',
  HiOutlineMail: 'Mail',
  HiOutlineKey: 'Key',
  HiUserGroup: 'Users',
  HiSearch: 'Search',
  HiExclamation: 'AlertTriangle',
  HiX: 'X',
};

const files = [
  'src/components/ViolationForm.jsx',
  'src/components/ViolationTable.jsx',
  'src/pages/StudentsPage.jsx',
  'src/pages/UsersPage.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let f = fs.readFileSync(file, 'utf8');
  
  // Replace imports from 'react-icons/hi'
  f = f.replace(/import\s*{([^}]+)}\s*from\s*'react-icons\/hi';/g, (match, imports) => {
    let newImports = imports.split(',').map(i => i.trim()).map(i => map[i] || i);
    newImports = [...new Set(newImports.filter(Boolean))];
    return `import { ${newImports.join(', ')} } from 'lucide-react';`;
  });

  // Replace <HiIcon with <LucideIcon
  for (const [k, v] of Object.entries(map)) {
    f = f.replaceAll(`<${k}`, `<${v}`);
    f = f.replaceAll(`</${k}`, `</${v}`);
  }
  
  fs.writeFileSync(file, f);
});

console.log('Icons updated successfully in phase 3.');
