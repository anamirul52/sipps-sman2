const fs = require('fs');
let f = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

// Replace import
f = f.replace(/import\s*{[^}]+}\s*from\s*'react-icons\/hi';/g, `import { Users, AlertCircle, AlertTriangle, ShieldCheck, ClipboardList, X, ArrowRight, ArrowLeft, Search, FileText, Eye, FileDown, Filter } from 'lucide-react';`);

// Replace icons
const map = {
  HiUsers: 'Users',
  HiExclamationCircle: 'AlertCircle',
  HiExclamation: 'AlertTriangle',
  HiShieldCheck: 'ShieldCheck',
  HiClipboardList: 'ClipboardList',
  HiX: 'X',
  HiArrowRight: 'ArrowRight',
  HiArrowLeft: 'ArrowLeft',
  HiSearch: 'Search',
  HiOutlineDocumentText: 'FileText',
  HiOutlineEye: 'Eye',
  HiDocumentDownload: 'FileDown',
  HiFilter: 'Filter'
};

for (const [k, v] of Object.entries(map)) {
  f = f.replaceAll(k, v);
}

fs.writeFileSync('src/components/Dashboard.jsx', f);
console.log('Dashboard updated');
