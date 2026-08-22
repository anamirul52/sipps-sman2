const fs = require('fs');

const path = 'frontend/src/pages/StudentsPage.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Inject State & Reset inside fetchStudents
const stateInjection = `  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);`;
code = code.replace('  const [deleting, setDeleting] = useState(false);', stateInjection);

const resetInjection = `  const fetchStudents = async () => {
    setLoading(true);
    setSelectedIds([]);`;
code = code.replace(/  const fetchStudents = async \(\) => \{\s*setLoading\(true\);/, resetInjection);

// 2. Inject Handlers
const handlers = `
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(currentStudents.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmDelete = window.confirm(\`Apakah Anda yakin ingin menghapus \${selectedIds.length} data siswa beserta seluruh riwayat pelanggaran dan sanksinya? Aksi ini tidak dapat dibatalkan.\`);
    if (!confirmDelete) return;

    setIsDeletingBatch(true);
    const toastId = toast.loading('Menghapus data siswa massal...');
    try {
      await api.post('/students/batch-delete', { ids: selectedIds });
      toast.success(\`\${selectedIds.length} data siswa berhasil dihapus\`, { id: toastId });
      setSelectedIds([]);
      fetchStudents();
    } catch (err) {
      console.error('Batch delete error:', err);
      toast.error(err.response?.data?.message || 'Gagal menghapus data massal', { id: toastId });
    } finally {
      setIsDeletingBatch(false);
    }
  };
`;
// Find suitable place, like before `const handleDeleteConfirm`
code = code.replace('  const handleDeleteConfirm = async () => {', handlers + '\n  const handleDeleteConfirm = async () => {');

fs.writeFileSync(path, code);
console.log('Injected states and handlers');
