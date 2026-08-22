import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import PointBadge from '../components/PointBadge';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, UserPlus, X, Phone, Download, Upload, FileText, CheckCircle, AlertTriangle, Trash2, Edit, AlertCircle, GraduationCap, Users, FileSpreadsheet, Sparkles } from 'lucide-react';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const [selectedClass, setSelectedClass] = useState(location.state?.selectedClass || '');
  const [gradeFilter, setGradeFilter] = useState(location.state?.gradeFilter || 'ALL'); // 'ALL', 'X', 'XI', 'XII'
  
  // Modal Tambah Siswa Manual
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nipd: '',
    name: '',
    class_id: '',
    parent_phone: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Modal Edit Siswa State
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nipd: '',
    name: '',
    class_id: '',
    parent_phone: ''
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Modal Template Download State
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Modal Import Excel State
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // State Exporting
  const [exporting, setExporting] = useState(false);

  // Modal Hapus Siswa State
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    setSelectedIds([]);
    try {
      let url = `/students?limit=all&search=${encodeURIComponent(search)}`;
      if (selectedClass) {
        url += `&class_id=${selectedClass}`;
      } else if (gradeFilter !== 'ALL') {
        url += `&grade=${gradeFilter}`;
      }
      const res = await api.get(url);
      setStudents(res.data.data || []);
    } catch (err) {
      toast.error('Gagal memuat data siswa');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/students/classes');
      setClasses(res.data.data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedClass, gradeFilter]);

  // Filter kelas berdasarkan Tingkat (X, XI, XII) untuk dropdown
  const filteredClasses = classes.filter((c) => {
    if (gradeFilter === 'ALL') return true;
    return c.class_name.startsWith(gradeFilter + '-');
  });

  const handleGradeChange = (grade) => {
    setGradeFilter(grade);
    setSelectedClass(''); // reset specific class selection
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!formData.nipd || !formData.name || !formData.class_id) {
      toast.error('Mohon lengkapi NIPD, Nama Siswa, dan Kelas');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/students', formData);
      toast.success('Siswa baru berhasil ditambahkan!');
      setShowModal(false);
      setFormData({ nipd: '', name: '', class_id: '', parent_phone: '' });
      fetchStudents();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menambahkan data siswa';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Buka Modal Edit Siswa
  const handleOpenEdit = (student) => {
    setStudentToEdit(student);
    setEditFormData({
      nipd: student.nipd || student.nisn || '',
      name: student.name || '',
      class_id: student.class_id || '',
      parent_phone: student.parent_phone || ''
    });
  };

  // Simpan Perubahan Data Siswa
  const handleEditStudent = async (e) => {
    e.preventDefault();
    if (!editFormData.nipd || !editFormData.name || !editFormData.class_id) {
      toast.error('Mohon lengkapi NIPD, Nama Siswa, dan Kelas');
      return;
    }

    setSubmittingEdit(true);
    try {
      const res = await api.put(`/students/${studentToEdit.id}`, editFormData);
      toast.success(res.data.message || 'Data siswa berhasil diperbarui!');
      setStudentToEdit(null);
      fetchStudents();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal memperbarui data siswa';
      toast.error(msg);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Download Template Excel (Standar / 1 Angkatan / Semua 33 Kelas)
  const handleDownloadTemplate = async (templateType = 'standard', grade = 'X') => {
    try {
      let url = '/students/template-excel';
      let filename = 'Template_Import_Siswa_Standar.xlsx';

      if (templateType === 'all') {
        url += '?grade=ALL';
        filename = 'Template_Master_Semua_Angkatan_(33_Kelas).xlsx';
      } else if (templateType === 'angkatan') {
        url += `?type=angkatan&grade=${grade}`;
        const gNum = grade === 'X' ? '10' : grade === 'XI' ? '11' : '12';
        filename = `Template_Angkatan_Kelas_${gNum}_(${grade}-A_sd_${grade}-K).xlsx`;
      }

      const response = await api.get(url, { responseType: 'blob' });
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`Template ${filename} berhasil diunduh!`);
    } catch (err) {
      toast.error('Gagal mengunduh template Excel');
    }
  };

  // Export Data Siswa ke Excel
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      let url = '/students/export-excel?';
      let title = 'Semua_Siswa';
      if (selectedClass) {
        url += `class_id=${selectedClass}&`;
        const cObj = classes.find(c => String(c.id) === String(selectedClass));
        if (cObj) title = `Kelas_${cObj.class_name}`;
      } else if (gradeFilter !== 'ALL') {
        url += `grade=${gradeFilter}&`;
        title = `Angkatan_Kelas_${gradeFilter}`;
      }
      if (search) {
        url += `search=${encodeURIComponent(search)}&`;
      }

      const response = await api.get(url, { responseType: 'blob' });
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Data_Siswa_${title}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Data siswa berhasil diekspor ke Excel!');
    } catch (err) {
      toast.error('Gagal mengekspor data siswa');
    } finally {
      setExporting(false);
    }
  };

  // Handle Import Excel Upload
  const handleImportExcel = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Silakan pilih file Excel (.xlsx / .xls) terlebih dahulu');
      return;
    }

    const data = new FormData();
    data.append('file', selectedFile);

    setUploading(true);
    setImportResult(null);

    try {
      const res = await api.post('/students/import-excel', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResult(res.data.data);
      toast.success(res.data.message || 'Import data siswa selesai!');
      fetchStudents();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengimpor file Excel';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(students.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data siswa beserta seluruh riwayat pelanggaran dan sanksinya? Aksi ini tidak dapat dibatalkan.`);
    if (!confirmDelete) return;

    setIsDeletingBatch(true);
    const toastId = toast.loading('Menghapus data siswa massal...');
    try {
      await api.post('/students/batch-delete', { ids: selectedIds });
      toast.success(`${selectedIds.length} data siswa berhasil dihapus`, { id: toastId });
      setSelectedIds([]);
      fetchStudents();
    } catch (err) {
      console.error('Batch delete error:', err);
      toast.error(err.response?.data?.message || 'Gagal menghapus data massal', { id: toastId });
    } finally {
      setIsDeletingBatch(false);
    }
  };

  // Handle Delete Student
  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;

    setDeleting(true);
    try {
      const res = await api.delete(`/students/${studentToDelete.id}`);
      toast.success(res.data.message || `Data siswa "${studentToDelete.name}" berhasil dihapus.`);
      setStudentToDelete(null);
      fetchStudents();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menghapus data siswa';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const selectedClassObj = classes.find(c => String(c.id) === String(selectedClass));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Title & Main Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 flex items-center gap-2">
              <div className="p-2 bg-zinc-900 text-white rounded-xl shadow-sm">
                <GraduationCap className="text-2xl" />
              </div>
              <span>Data Siswa</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">Kelola seluruh data siswa sekolah</p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
            {/* 1. Tombol Unduh Template */}
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-2 bg-white border border-zinc-200 hover:border-indigo-300 hover:bg-zinc-100/50 text-zinc-700 font-semibold px-2.5 sm:px-3.5 py-2 rounded-xl shadow-xs text-xs sm:text-sm transition group"
              title="Unduh format file Excel resmi untuk pengisian data siswa"
            >
              <div className="p-1.5 bg-zinc-100 text-zinc-600 rounded-lg group-hover:bg-zinc-900 group-hover:text-white transition flex-shrink-0">
                <Download className="text-sm sm:text-base" />
              </div>
              <div className="text-left truncate">
                <div className="leading-tight truncate">Template Excel</div>
                <div className="text-[10px] text-zinc-400 font-normal truncate">Format Standar</div>
              </div>
            </button>

            {/* 2. Export Excel Button */}
            {selectedIds.length > 0 && (
                <button
                  onClick={handleBatchDelete}
                  disabled={isDeletingBatch}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium px-4 py-2 sm:py-2.5 rounded-xl shadow-sm transition disabled:opacity-50 whitespace-nowrap"
                >
                  <Trash2 className="text-lg" />
                  <span className="hidden sm:inline">{isDeletingBatch ? 'Menghapus...' : `Hapus (${selectedIds.length}) Data`}</span>
                  <span className="sm:hidden">{selectedIds.length}</span>
                </button>
              )}
              <button
                onClick={handleExportExcel}
              disabled={exporting || students.length === 0}
              className="flex items-center gap-2 bg-white border border-blue-200 hover:border-blue-300 hover:bg-blue-50/50 text-blue-700 font-semibold px-2.5 sm:px-3.5 py-2 rounded-xl shadow-xs text-xs sm:text-sm transition group disabled:opacity-50"
              title="Ekspor seluruh data siswa saat ini ke dalam format Excel (.xlsx)"
            >
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition flex-shrink-0">
                <FileSpreadsheet className="text-sm sm:text-base" />
              </div>
              <div className="text-left truncate">
                <div className="leading-tight truncate">{exporting ? 'Mengekspor...' : 'Export Excel'}</div>
                <div className="text-[10px] text-blue-400 font-normal truncate">Unduh Data (.xlsx)</div>
              </div>
            </button>

            {/* 3. Import Excel Button */}
            <button
              onClick={() => { setShowImportModal(true); setImportResult(null); }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 sm:px-3.5 py-2 rounded-xl shadow-sm text-xs sm:text-sm transition group"
              title="Unggah file Excel untuk memasukkan data siswa massal / 1 angkatan sekaligus"
            >
              <div className="p-1.5 bg-white/20 text-white rounded-lg group-hover:bg-white group-hover:text-emerald-700 transition flex-shrink-0">
                <Upload className="text-sm sm:text-base" />
              </div>
              <div className="text-left truncate">
                <div className="leading-tight truncate">Import Excel</div>
                <div className="text-[10px] text-emerald-100 font-normal truncate">Input Massal</div>
              </div>
            </button>

            {/* 4. Tambah Manual Button */}
            <button
              onClick={() => {
                setFormData({
                  nipd: '',
                  name: '',
                  class_id: selectedClass || '',
                  parent_phone: ''
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-2.5 sm:px-4 py-2 rounded-xl shadow-sm text-xs sm:text-sm transition group"
              title="Tambah data satu siswa baru secara manual"
            >
              <div className="p-1.5 bg-white/20 text-white rounded-lg group-hover:bg-white group-hover:text-indigo-700 transition flex-shrink-0">
                <Plus className="text-sm sm:text-base" />
              </div>
              <div className="text-left truncate">
                <div className="leading-tight truncate">Tambah Siswa</div>
                <div className="text-[10px] text-indigo-100 font-normal truncate">Input Manual</div>
              </div>
            </button>
          </div>
        </div>

        {/* Feature Highlights / Quick Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Card 1: Tambah Siswa */}
          <div 
            onClick={() => {
              setFormData({
                nipd: '',
                name: '',
                class_id: selectedClass || '',
                parent_phone: ''
              });
              setShowModal(true);
            }}
            className="p-3.5 bg-white rounded-xl border border-zinc-200/80 hover:border-indigo-300 hover:bg-zinc-50 transition cursor-pointer group flex items-start gap-3"
          >
            <div className="p-2 bg-zinc-100 text-zinc-600 rounded-lg group-hover:bg-zinc-900 group-hover:text-white transition flex-shrink-0 mt-0.5">
              <UserPlus className="text-lg" />
            </div>
            <div>
              <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 group-hover:text-zinc-600 transition">Tambah Siswa Manual</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                Input data individu siswa baru beserta NIPD, kelas, dan kontak orang tua.
              </p>
            </div>
          </div>

          {/* Card 2: Import Excel */}
          <div 
            onClick={() => { setShowImportModal(true); setImportResult(null); }}
            className="p-3.5 bg-white rounded-xl border border-zinc-200/80 hover:border-emerald-300 transition cursor-pointer group flex items-start gap-3 shadow-sm hover:bg-zinc-50"
          >
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition flex-shrink-0 mt-0.5">
              <Upload className="text-lg" />
            </div>
            <div>
              <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 group-hover:text-emerald-600 transition">Import Excel Massal</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                Upload 1 angkatan ratusan siswa secara instan menggunakan spreadsheet.
              </p>
            </div>
          </div>

          {/* Card 3: Export Excel */}
          <div 
            onClick={handleExportExcel}
            className="p-3.5 bg-white rounded-xl border border-zinc-200/80 hover:border-blue-300 transition cursor-pointer group flex items-start gap-3 shadow-sm hover:bg-zinc-50"
          >
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition flex-shrink-0 mt-0.5">
              <FileSpreadsheet className="text-lg" />
            </div>
            <div>
              <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 group-hover:text-blue-600 transition">Export Rekap Excel</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                Unduh rekapitulasi data seluruh siswa aktif ke format file spreadsheet (.xlsx).
              </p>
            </div>
          </div>

          {/* Card 4: Template Excel */}
          <div 
            onClick={() => setShowTemplateModal(true)}
            className="p-3.5 bg-white rounded-xl border border-zinc-200/80 hover:border-purple-300 transition cursor-pointer group flex items-start gap-3 shadow-sm hover:bg-zinc-50"
          >
            <div className="p-2 bg-zinc-100 text-zinc-600 rounded-lg group-hover:bg-zinc-900 group-hover:text-white transition flex-shrink-0 mt-0.5">
              <Download className="text-lg" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-zinc-900 group-hover:text-zinc-600 transition">Template Resmi Excel</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                Unduh format tabel resmi dengan struktur kelas SMAN 2 Salatiga siap isi.
              </p>
            </div>
          </div>
        </div>

        {/* Tingkat Tabs & Filter Box */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-5 space-y-4">
          {/* Quick Level Filter Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2.5 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full flex-nowrap sm:flex-wrap">
              <button
                onClick={() => handleGradeChange('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition ${
                  gradeFilter === 'ALL'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Semua Tingkat
              </button>
              <button
                onClick={() => handleGradeChange('X')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition ${
                  gradeFilter === 'X'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Kelas 10 (X)
              </button>
              <button
                onClick={() => handleGradeChange('XI')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition ${
                  gradeFilter === 'XI'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Kelas 11 (XI)
              </button>
              <button
                onClick={() => handleGradeChange('XII')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition ${
                  gradeFilter === 'XII'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Kelas 12 (XII)
              </button>
            </div>

            {/* Quick Summary Pill */}
            <div className="flex items-center space-x-1.5 text-xs bg-zinc-100 text-indigo-700 px-2.5 py-1 rounded-lg font-semibold border border-indigo-100 whitespace-nowrap">
              <Users className="text-sm" />
              <span>{students.length} Siswa</span>
            </div>
          </div>

          {/* Search & Specific Class Select */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama siswa atau NIPD..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm"
              />
            </div>

            <div className="w-full md:w-72">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm bg-white font-medium text-zinc-700"
              >
                <option value="">
                  {gradeFilter === 'ALL' ? 'Semua Kelas (33 Kelas A - K)' : `Semua Kelas Tingkat ${gradeFilter} (A - K)`}
                </option>
                {filteredClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.class_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Banner Indicator */}
        <div className="flex items-center justify-between px-2">
          <div className="text-sm font-semibold text-zinc-700">
            {selectedClassObj ? (
              <span>
                Menampilkan seluruh siswa di <span className="text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-indigo-200">Kelas {selectedClassObj.class_name}</span> ({students.length} siswa)
              </span>
            ) : gradeFilter !== 'ALL' ? (
              <span>
                Menampilkan seluruh siswa <span className="text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-indigo-200">Angkatan Kelas {gradeFilter} (A s/d K)</span> ({students.length} siswa)
              </span>
            ) : (
              <span>Menampilkan seluruh siswa sekolah ({students.length} siswa)</span>
            )}
          </div>
        </div>

        {/* Table / Cards of Students */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-zinc-200">
          {/* Mobile View: Cards (Tampil di Layar HP) */}
          <div className="md:hidden p-3 space-y-3">
            {students.length > 0 && !loading && (
              <div className="flex items-center gap-2 px-1 mb-1">
                <input
                  type="checkbox"
                  id="selectAllMobile"
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  checked={selectedIds.length === students.length}
                  onChange={handleSelectAll}
                />
                <label htmlFor="selectAllMobile" className="text-xs font-semibold text-zinc-700 cursor-pointer">
                  Pilih Semua ({students.length})
                </label>
              </div>
            )}
            {loading ? (
              <div className="p-8 text-center text-zinc-400">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
                  <span className="text-xs">Memuat seluruh data siswa...</span>
                </div>
              </div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="bg-zinc-100 p-3 rounded-full text-zinc-400">
                    <Users className="text-2xl" />
                  </div>
                  <div className="font-medium text-xs text-zinc-700">
                    {selectedClassObj 
                      ? `Belum ada data siswa di Kelas ${selectedClassObj.class_name}` 
                      : 'Tidak ada data siswa yang cocok'}
                  </div>
                </div>
              </div>
            ) : (
              students.map((student, index) => (
                <div key={student.id} className={`p-3.5 rounded-xl border shadow-sm space-y-2.5 transition ${selectedIds.includes(student.id) ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white border-zinc-200'}`}>
                  {/* Header: Nama Siswa, Kelas & Poin */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => handleSelectOne(student.id)}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-900 text-xs sm:text-sm leading-tight truncate">
                          {student.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          NIPD: {student.nipd || student.nisn || '-'} &bull; Kelas: <span className="font-semibold text-indigo-700">{student.class_name || '-'}</span>
                        </div>
                      </div>
                    </div>
                    <PointBadge points={student.total_points || 0} />
                  </div>

                  {/* Kontak Ortu */}
                  <div className="text-xs text-zinc-600 bg-zinc-50 p-2 rounded-lg border border-zinc-100 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">No. HP Orang Tua:</span>
                    {student.parent_phone ? (
                      <a 
                        href={`tel:${student.parent_phone}`} 
                        className="font-semibold text-zinc-600 flex items-center gap-1 hover:underline text-xs"
                      >
                        <Phone className="text-xs" />
                        <span>{student.parent_phone}</span>
                      </a>
                    ) : (
                      <span className="text-zinc-400 italic text-[11px]">-</span>
                    )}
                  </div>

                  {/* Tombol Aksi 2 Kolom */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      onClick={() => handleOpenEdit(student)}
                      className="w-full py-1.5 bg-zinc-100 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                      title="Edit data siswa ini"
                    >
                      <Edit className="text-sm" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setStudentToDelete(student)}
                      className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                      title="Hapus data siswa ini"
                    >
                      <Trash2 className="text-sm" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Desktop View: Table (Tampil di Tablet / PC - Proporsional & Rapi) */}
          <div className="hidden md:block overflow-hidden border border-zinc-200">
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase font-semibold text-zinc-500 tracking-wider">
                <tr>
                  <th className="px-2 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={students.length > 0 && selectedIds.length === students.length}
                      onChange={handleSelectAll}
                      title="Pilih Semua"
                    />
                  </th>
                  <th className="px-2 py-3 text-center w-10">No</th>
                  <th className="px-3 py-3 w-[32%]">Nama Siswa</th>
                  <th className="px-2 py-3 text-center w-[13%]">NIPD</th>
                  <th className="px-2 py-3 text-center w-16">Kelas</th>
                  <th className="px-2 py-3 text-center w-[13%]">No. Telp Ortu</th>
                  <th className="px-2 py-3 text-center w-[16%]">Akumulasi Poin</th>
                  <th className="px-2 py-3 text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-zinc-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
                        <span className="text-sm">Memuat seluruh data siswa...</span>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="bg-zinc-100 p-3 rounded-full text-zinc-400">
                          <Users className="text-3xl" />
                        </div>
                        <div className="font-medium text-zinc-700">
                          {selectedClassObj 
                            ? `Belum ada data siswa di Kelas ${selectedClassObj.class_name}` 
                            : 'Tidak ada data siswa yang cocok'}
                        </div>
                        <p className="text-xs text-zinc-400 max-w-sm">
                          Gunakan template 1 angkatan agar proses input data kelas X, XI, atau XII dapat selesai dengan sangat cepat.
                        </p>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setShowTemplateModal(true)}
                            className="text-xs bg-zinc-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition font-semibold flex items-center"
                          >
                            <Download className="mr-1" /> Unduh Template Angkatan
                          </button>
                          <button
                            onClick={() => setShowImportModal(true)}
                            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition font-medium flex items-center"
                          >
                            <Upload className="mr-1" /> Import Excel Sekarang
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => (
                    <tr key={student.id} className={`transition ${selectedIds.includes(student.id) ? 'bg-indigo-50/40' : 'hover:bg-zinc-100/30'}`}>
                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={selectedIds.includes(student.id)}
                          onChange={() => handleSelectOne(student.id)}
                        />
                      </td>
                      <td className="px-2 py-3 text-center text-zinc-500 font-semibold">{index + 1}</td>
                      <td className="px-3 py-3">
                        <div className="font-bold text-zinc-900 text-xs sm:text-sm leading-snug truncate" title={student.name}>
                          {student.name}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center text-xs text-zinc-600 font-mono font-medium truncate">
                        {student.nipd || student.nisn || '-'}
                      </td>
                      <td className="px-2 py-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-[11px] bg-zinc-100 text-indigo-700 border border-indigo-200 min-w-[55px]">
                          {student.class_name || '-'}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center text-xs text-zinc-600 truncate">
                        {student.parent_phone ? (
                          <a 
                            href={`tel:${student.parent_phone}`} 
                            className="inline-flex items-center justify-center text-zinc-700 hover:text-zinc-600 font-medium truncate"
                            title={`Hubungi: ${student.parent_phone}`}
                          >
                            <Phone className="mr-1 text-zinc-400 text-xs flex-shrink-0" />
                            <span className="truncate">{student.parent_phone}</span>
                          </a>
                        ) : (
                          <span className="text-zinc-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <PointBadge points={student.total_points || 0} stacked={true} />
                      </td>
                      <td className="px-2 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 bg-zinc-100 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition shadow-sm cursor-pointer"
                            title="Edit data siswa ini"
                          >
                            <Edit className="text-xs" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setStudentToDelete(student)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition shadow-sm cursor-pointer"
                            title="Hapus data siswa ini"
                          >
                            <Trash2 className="text-xs" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL PILIHAN TEMPLATE EXCEL CEPAT */}
        {showTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
              <div className="px-6 py-4 bg-zinc-100 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center">
                  <Download className="mr-2 text-zinc-600 text-xl" />
                  Pusat Template Excel Siswa
                </h3>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 p-1 rounded-full hover:bg-white"
                >
                  <X className="text-xl" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-zinc-600">
                  Pilih format template Excel yang ingin diunduh sesuai kebutuhan Anda:
                </p>

                <div className="space-y-3">
                  {/* Master 33 Kelas */}
                  <div className="p-4 rounded-xl border-2 border-indigo-100 bg-zinc-100/40 hover:border-indigo-400 transition flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-zinc-900 flex items-center text-sm">
                        <Sparkles className="text-zinc-600 mr-1.5" />
                        Template Master Seluruh Angkatan (33 Sheet Kelas)
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Berisi 33 sheet terpisah untuk seluruh kelas dari X-A s/d XII-K dalam 1 file master.
                      </p>
                    </div>
                    <button
                      onClick={() => { handleDownloadTemplate('all'); setShowTemplateModal(false); }}
                      className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center whitespace-nowrap"
                    >
                      <Download className="mr-1 text-sm" /> Unduh
                    </button>
                  </div>

                  {/* Angkatan 10 */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 hover:border-emerald-400 bg-zinc-50/50 hover:bg-emerald-50/30 transition flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-zinc-900 text-sm">
                        Template Angkatan Kelas 10 (11 Sheet: X-A s/d X-K)
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        11 Sheet terbagi rapi per kelas untuk siswa baru kelas 10.
                      </p>
                    </div>
                    <button
                      onClick={() => { handleDownloadTemplate('angkatan', 'X'); setShowTemplateModal(false); }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center whitespace-nowrap"
                    >
                      <Download className="mr-1" /> Unduh
                    </button>
                  </div>

                  {/* Angkatan 11 */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 hover:border-emerald-400 bg-zinc-50/50 hover:bg-emerald-50/30 transition flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-zinc-900 text-sm">
                        Template Angkatan Kelas 11 (11 Sheet: XI-A s/d XI-K)
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        11 Sheet terbagi rapi untuk angkatan kelas 11.
                      </p>
                    </div>
                    <button
                      onClick={() => { handleDownloadTemplate('angkatan', 'XI'); setShowTemplateModal(false); }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center whitespace-nowrap"
                    >
                      <Download className="mr-1" /> Unduh
                    </button>
                  </div>

                  {/* Angkatan 12 */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 hover:border-emerald-400 bg-zinc-50/50 hover:bg-emerald-50/30 transition flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-zinc-900 text-sm">
                        Template Angkatan Kelas 12 (11 Sheet: XII-A s/d XII-K)
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        11 Sheet terbagi rapi untuk angkatan kelas 12.
                      </p>
                    </div>
                    <button
                      onClick={() => { handleDownloadTemplate('angkatan', 'XII'); setShowTemplateModal(false); }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center whitespace-nowrap"
                    >
                      <Download className="mr-1" /> Unduh
                    </button>
                  </div>

                  {/* Standar 1 Sheet */}
                  <div className="p-3 rounded-xl border border-zinc-200 hover:border-zinc-400 bg-white transition flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-zinc-800 text-xs">
                        Template Standar (1 Sheet Campuran)
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        1 Lembar kerja tunggal dengan kolom NIPD, Nama, Kelas, No. HP.
                      </p>
                    </div>
                    <button
                      onClick={() => { handleDownloadTemplate('standard'); setShowTemplateModal(false); }}
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300 rounded-lg text-xs font-medium flex items-center whitespace-nowrap"
                    >
                      <Download className="mr-1" /> Unduh
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(false)}
                    className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 text-sm font-medium"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus Siswa */}
        {studentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in">
              <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-red-900 flex items-center">
                  <AlertCircle className="mr-2 text-red-600 text-2xl" />
                  Konfirmasi Hapus Siswa
                </h3>
                <button
                  onClick={() => setStudentToDelete(null)}
                  className="text-zinc-400 hover:text-zinc-600 p-1 rounded-full hover:bg-white"
                >
                  <X className="text-xl" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-zinc-600">
                  Apakah Anda yakin ingin menghapus data siswa berikut?
                </p>

                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-sm space-y-1">
                  <div className="font-bold text-zinc-900 text-base">{studentToDelete.name}</div>
                  <div className="text-zinc-600">NIPD: <span className="font-mono font-semibold">{studentToDelete.nipd || studentToDelete.nisn}</span></div>
                  <div className="text-zinc-600">Kelas: <span className="font-semibold text-zinc-600">{studentToDelete.class_name || '-'}</span></div>
                  <div className="text-zinc-600">Total Poin Saat Ini: <span className="font-semibold text-red-600">{studentToDelete.total_points || 0} Poin</span></div>
                </div>

                <div className="p-3 bg-zinc-100 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start space-x-2">
                  <AlertTriangle className="text-lg text-zinc-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Peringatan:</strong> Menghapus data siswa ini juga akan menghapus seluruh riwayat catatan pelanggaran dan surat sanksi yang terkait.
                  </span>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setStudentToDelete(null)}
                    className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 text-sm font-medium transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleConfirmDelete}
                    className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium shadow disabled:opacity-50 transition flex items-center space-x-1.5"
                  >
                    {deleting ? (
                      <span>Menghapus...</span>
                    ) : (
                      <>
                        <Trash2 />
                        <span>Ya, Hapus Siswa</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Import Excel (Mendukung 1 Angkatan & Multi-Sheet) */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all">
              <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-emerald-900 flex items-center">
                  <Upload className="mr-2 text-emerald-600 text-xl" />
                  Import Data Siswa (1 Angkatan Sekaligus)
                </h3>
                <button
                  onClick={handleCloseImportModal}
                  className="text-zinc-400 hover:text-zinc-600 p-1 rounded-full hover:bg-white"
                >
                  <X className="text-xl" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Petunjuk Format & Download Template Angkatan */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 space-y-2">
                  <div className="font-semibold text-blue-900 flex items-center">
                    <FileText className="mr-1 text-base" /> Dukungan Import 1 Angkatan:
                  </div>
                  <p>&bull; Anda dapat mengunggah file Excel berisi 11 sheet (Kelas A s/d K) atau 1 sheet master.</p>
                  <p>&bull; Sistem otomatis mendeteksi nama sheet atau kolom <code className="bg-white px-1 py-0.5 rounded border border-blue-200">Kelas</code> dan mengimpor seluruh siswa sekaligus.</p>
                  
                  <div className="pt-2 border-t border-blue-200 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTemplateModal(true)}
                      className="text-indigo-700 bg-white border border-indigo-200 hover:bg-zinc-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-sm"
                    >
                      <Download className="mr-1 text-sm" /> Buka Pusat Unduh Template Angkatan
                    </button>
                  </div>
                </div>

                {/* Upload File Input */}
                <form onSubmit={handleImportExcel} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                      Pilih File Excel yang Siap Diimpor (.xlsx / .xls)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls"
                      required
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="block w-full text-sm text-zinc-500
                        file:mr-4 file:py-2.5 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-emerald-50 file:text-emerald-700
                        hover:file:bg-emerald-100 cursor-pointer border border-zinc-300 rounded-lg p-1"
                    />
                  </div>

                  {selectedFile && (
                    <div className="text-xs text-zinc-500 flex items-center">
                      <span className="font-medium text-zinc-700 mr-1">File terpilih:</span> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}

                  {/* Hasil Import Summary */}
                  {importResult && (
                    <div className="mt-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                      <div className="flex items-center text-sm font-semibold text-zinc-800">
                        <CheckCircle className="mr-1 text-emerald-600 text-lg" />
                        Hasil Pemrosesan:
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-white rounded-lg border border-zinc-200">
                          <div className="text-zinc-500">Total Baris</div>
                          <div className="font-bold text-zinc-800 text-base">{importResult.total_processed}</div>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                          <div className="text-emerald-700">Berhasil</div>
                          <div className="font-bold text-emerald-800 text-base">{importResult.success_count}</div>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                          <div className="text-red-700">Gagal</div>
                          <div className="font-bold text-red-800 text-base">{importResult.error_count}</div>
                        </div>
                      </div>

                      {/* Rincian per-sheet */}
                      {importResult.sheet_summaries && importResult.sheet_summaries.length > 0 && (
                        <div className="mt-2 text-xs bg-white p-2.5 rounded-lg border border-zinc-200 space-y-1">
                          <span className="font-semibold text-zinc-700 block">Rincian Siswa Masuk per Sheet:</span>
                          <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
                            {importResult.sheet_summaries.map((s, idx) => (
                              <div key={idx} className="bg-zinc-50 px-2 py-1 rounded text-[11px] flex justify-between">
                                <span>Sheet <strong>{s.sheet}</strong></span>
                                <span className="text-emerald-700 font-bold">+{s.imported}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-2 max-h-32 overflow-y-auto bg-red-50 p-2.5 rounded-lg border border-red-100 text-[11px] text-red-700 space-y-1">
                          <div className="font-semibold flex items-center">
                            <AlertTriangle className="mr-1" /> Catatan Kesalahan:
                          </div>
                          {importResult.errors.map((err, idx) => (
                            <div key={idx}>&bull; {err}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={handleCloseImportModal}
                      className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 text-sm font-medium"
                    >
                      {importResult ? 'Selesai' : 'Batal'}
                    </button>
                    <button
                      type="submit"
                      disabled={uploading || !selectedFile}
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow disabled:opacity-50 flex items-center space-x-1.5"
                    >
                      {uploading ? (
                        <span>Mengimpor Seluruh Angkatan...</span>
                      ) : (
                        <span>Mulai Import Excel</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tambah Siswa Manual */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
              <div className="px-6 py-4 bg-zinc-100 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center">
                  <UserPlus className="mr-2 text-zinc-600 text-xl" />
                  Tambah Siswa Baru Manual
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 p-1 rounded-full hover:bg-white"
                >
                  <X className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    NIPD <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nipd}
                    onChange={(e) => setFormData({ ...formData, nipd: e.target.value })}
                    placeholder="Contoh: 0012345678"
                    className="w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Nama Lengkap Siswa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nama lengkap siswa"
                    className="w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>Kelas {c.class_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Nomor WhatsApp / Telp Orang Tua
                  </label>
                  <input
                    type="text"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 text-sm font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium shadow disabled:opacity-50"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan Siswa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Data Siswa */}
        {studentToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
              <div className="px-6 py-4 bg-zinc-100 border-b border-amber-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-amber-950 flex items-center">
                  <Edit className="mr-2 text-zinc-600 text-xl" />
                  Edit Data Siswa
                </h3>
                <button
                  onClick={() => setStudentToEdit(null)}
                  className="text-zinc-400 hover:text-zinc-600 p-1 rounded-full hover:bg-white transition"
                >
                  <X className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleEditStudent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    NIPD / NISN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.nipd}
                    onChange={(e) => setEditFormData({ ...editFormData, nipd: e.target.value })}
                    placeholder="Contoh: 0012345678"
                    className="w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Nama Lengkap Siswa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="Nama lengkap siswa"
                    className="w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={editFormData.class_id}
                    onChange={(e) => setEditFormData({ ...editFormData, class_id: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>Kelas {c.class_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Nomor WhatsApp / Telp Orang Tua
                  </label>
                  <input
                    type="text"
                    value={editFormData.parent_phone}
                    onChange={(e) => setEditFormData({ ...editFormData, parent_phone: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setStudentToEdit(null)}
                    className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 text-sm font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium shadow disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    {submittingEdit ? (
                      <span>Menyimpan Perubahan...</span>
                    ) : (
                      <span>Simpan Perubahan</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentsPage;
