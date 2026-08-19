import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import PointBadge from '../components/PointBadge';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { 
  HiPlus, 
  HiSearch, 
  HiUserAdd, 
  HiX, 
  HiPhone, 
  HiDownload, 
  HiUpload, 
  HiDocumentText, 
  HiCheckCircle, 
  HiExclamation,
  HiTrash,
  HiExclamationCircle,
  HiAcademicCap,
  HiUsers,
  HiDocumentReport,
  HiSparkles
} from 'react-icons/hi';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL'); // 'ALL', 'X', 'XI', 'XII'
  
  // Modal Tambah Siswa Manual
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nipd: '',
    name: '',
    class_id: '',
    parent_phone: ''
  });
  const [submitting, setSubmitting] = useState(false);

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

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = `/students?limit=all&search=${encodeURIComponent(search)}`;
      if (selectedClass) {
        url += `&class_id=${selectedClass}`;
      }
      const res = await api.get(url);
      let list = res.data.data || [];
      if (!selectedClass && gradeFilter !== 'ALL') {
        list = list.filter(s => (s.class_name || '').startsWith(gradeFilter + '-'));
      }
      setStudents(list);
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
                <HiAcademicCap className="text-2xl" />
              </div>
              <span>Data Siswa</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Kelola seluruh data siswa sekolah</p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* 1. Tombol Unduh Template */}
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-700 font-semibold px-3.5 py-2 rounded-xl shadow-xs text-xs sm:text-sm transition group"
              title="Unduh format file Excel resmi untuk pengisian data siswa"
            >
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition">
                <HiDownload className="text-base" />
              </div>
              <div className="text-left">
                <div className="leading-tight">Template Excel</div>
                <div className="text-[10px] text-gray-400 font-normal">Format Standar</div>
              </div>
            </button>

            {/* 2. Export Excel Button */}
            <button
              onClick={handleExportExcel}
              disabled={exporting || students.length === 0}
              className="flex items-center gap-2 bg-white border border-blue-200 hover:border-blue-300 hover:bg-blue-50/50 text-blue-700 font-semibold px-3.5 py-2 rounded-xl shadow-xs text-xs sm:text-sm transition group disabled:opacity-50"
              title="Ekspor seluruh data siswa saat ini ke dalam format Excel (.xlsx)"
            >
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                <HiDocumentReport className="text-base" />
              </div>
              <div className="text-left">
                <div className="leading-tight">{exporting ? 'Mengekspor...' : 'Export Excel'}</div>
                <div className="text-[10px] text-blue-400 font-normal">Unduh Data (.xlsx)</div>
              </div>
            </button>

            {/* 3. Import Excel Button */}
            <button
              onClick={() => { setShowImportModal(true); setImportResult(null); }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-2 rounded-xl shadow-sm text-xs sm:text-sm transition group"
              title="Unggah file Excel untuk memasukkan data siswa massal / 1 angkatan sekaligus"
            >
              <div className="p-1.5 bg-white/20 text-white rounded-lg group-hover:bg-white group-hover:text-emerald-700 transition">
                <HiUpload className="text-base" />
              </div>
              <div className="text-left">
                <div className="leading-tight">Import Excel</div>
                <div className="text-[10px] text-emerald-100 font-normal">Input Massal</div>
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
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl shadow-md text-xs sm:text-sm transition group"
              title="Tambah data satu siswa baru secara manual"
            >
              <div className="p-1.5 bg-white/20 text-white rounded-lg group-hover:bg-white group-hover:text-indigo-700 transition">
                <HiPlus className="text-base" />
              </div>
              <div className="text-left">
                <div className="leading-tight">Tambah Siswa</div>
                <div className="text-[10px] text-indigo-100 font-normal">Input Manual</div>
              </div>
            </button>
          </div>
        </div>

        {/* Feature Highlights / Quick Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            className="p-3.5 bg-white rounded-xl border border-gray-200/80 hover:border-indigo-300 hover:shadow-md transition cursor-pointer group flex items-start gap-3"
          >
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition flex-shrink-0 mt-0.5">
              <HiUserAdd className="text-lg" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-indigo-600 transition">Tambah Siswa Manual</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                Input data individu siswa baru beserta NIPD, kelas, dan kontak orang tua.
              </p>
            </div>
          </div>

          {/* Card 2: Import Excel */}
          <div 
            onClick={() => { setShowImportModal(true); setImportResult(null); }}
            className="p-3.5 bg-white rounded-xl border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition cursor-pointer group flex items-start gap-3"
          >
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition flex-shrink-0 mt-0.5">
              <HiUpload className="text-lg" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-emerald-600 transition">Import Excel Massal</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                Upload 1 angkatan ratusan siswa secara instan menggunakan spreadsheet.
              </p>
            </div>
          </div>

          {/* Card 3: Export Excel */}
          <div 
            onClick={handleExportExcel}
            className="p-3.5 bg-white rounded-xl border border-gray-200/80 hover:border-blue-300 hover:shadow-md transition cursor-pointer group flex items-start gap-3"
          >
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition flex-shrink-0 mt-0.5">
              <HiDocumentReport className="text-lg" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-blue-600 transition">Export Rekap Excel</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                Unduh rekapitulasi data seluruh siswa aktif ke format file spreadsheet (.xlsx).
              </p>
            </div>
          </div>

          {/* Card 4: Template Excel */}
          <div 
            onClick={() => setShowTemplateModal(true)}
            className="p-3.5 bg-white rounded-xl border border-gray-200/80 hover:border-purple-300 hover:shadow-md transition cursor-pointer group flex items-start gap-3"
          >
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition flex-shrink-0 mt-0.5">
              <HiDownload className="text-lg" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-purple-600 transition">Template Resmi Excel</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                Unduh format tabel resmi dengan struktur kelas SMAN 2 Salatiga siap isi.
              </p>
            </div>
          </div>
        </div>


        {/* Tingkat Tabs & Filter Box */}
        <div className="bg-white rounded-xl shadow p-5 space-y-4">
          {/* Quick Level Filter Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Tingkat / Angkatan:</span>
              <button
                onClick={() => handleGradeChange('ALL')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  gradeFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Semua Tingkat (10 - 12)
              </button>
              <button
                onClick={() => handleGradeChange('X')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  gradeFilter === 'X'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Angkatan Kelas 10 (X)
              </button>
              <button
                onClick={() => handleGradeChange('XI')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  gradeFilter === 'XI'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Angkatan Kelas 11 (XI)
              </button>
              <button
                onClick={() => handleGradeChange('XII')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  gradeFilter === 'XII'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Angkatan Kelas 12 (XII)
              </button>
            </div>

            {/* Quick Summary Pill */}
            <div className="flex items-center space-x-2 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-medium border border-indigo-100">
              <HiUsers className="text-base" />
              <span>Data Tampil: <strong>{students.length}</strong> Siswa</span>
            </div>
          </div>

          {/* Search & Specific Class Select */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama siswa atau NIPD..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="w-full md:w-72">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white font-medium text-gray-700"
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
          <div className="text-sm font-semibold text-gray-700">
            {selectedClassObj ? (
              <span>
                Menampilkan seluruh siswa di <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Kelas {selectedClassObj.class_name}</span> ({students.length} siswa)
              </span>
            ) : gradeFilter !== 'ALL' ? (
              <span>
                Menampilkan seluruh siswa <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Angkatan Kelas {gradeFilter} (A s/d K)</span> ({students.length} siswa)
              </span>
            ) : (
              <span>Menampilkan seluruh siswa sekolah ({students.length} siswa)</span>
            )}
          </div>
        </div>

        {/* Table of Students */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-12 whitespace-nowrap">No</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px] whitespace-nowrap">Nama Siswa</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px] whitespace-nowrap">NIPD</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[100px] whitespace-nowrap">Kelas</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[150px] whitespace-nowrap">No. Telp Ortu</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px] whitespace-nowrap">Akumulasi Poin</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="text-sm">Memuat seluruh data siswa...</span>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="bg-gray-100 p-3 rounded-full text-gray-400">
                          <HiUsers className="text-3xl" />
                        </div>
                        <div className="font-medium text-gray-700">
                          {selectedClassObj 
                            ? `Belum ada data siswa di Kelas ${selectedClassObj.class_name}` 
                            : 'Tidak ada data siswa yang cocok'}
                        </div>
                        <p className="text-xs text-gray-400 max-w-sm">
                          Gunakan template 1 angkatan agar proses input data kelas X, XI, atau XII dapat selesai dengan sangat cepat.
                        </p>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setShowTemplateModal(true)}
                            className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition font-semibold flex items-center"
                          >
                            <HiDownload className="mr-1" /> Unduh Template Angkatan
                          </button>
                          <button
                            onClick={() => setShowImportModal(true)}
                            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition font-medium flex items-center"
                          >
                            <HiUpload className="mr-1" /> Import Excel Sekarang
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => (
                    <tr key={student.id} className="hover:bg-indigo-50/40 transition">
                      <td className="px-4 py-3.5 text-xs sm:text-sm text-gray-500 font-medium text-center whitespace-nowrap">{index + 1}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs sm:text-sm text-gray-600 font-mono font-medium whitespace-nowrap">{student.nipd || student.nisn || '-'}</td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 min-w-[65px] whitespace-nowrap">
                          {student.class_name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                        {student.parent_phone ? (
                          <span className="flex items-center text-gray-600">
                            <HiPhone className="mr-1 text-gray-400 text-sm" />
                            {student.parent_phone}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <PointBadge points={student.total_points || 0} />
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => setStudentToDelete(student)}
                          className="inline-flex items-center space-x-1 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-medium transition"
                          title="Hapus data siswa ini"
                        >
                          <HiTrash className="text-sm" />
                          <span>Hapus</span>
                        </button>
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-indigo-900 flex items-center">
                  <HiDownload className="mr-2 text-indigo-600 text-xl" />
                  Pusat Template Excel Siswa
                </h3>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-white"
                >
                  <HiX className="text-xl" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Pilih format template Excel yang ingin diunduh sesuai kebutuhan Anda:
                </p>

                <div className="space-y-3">
                  {/* Master 33 Kelas */}
                  <div className="p-4 rounded-xl border-2 border-indigo-100 bg-indigo-50/40 hover:border-indigo-400 transition flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-indigo-950 flex items-center text-sm">
                        <HiSparkles className="text-indigo-600 mr-1.5" />
                        Template Master Seluruh Angkatan (33 Sheet Kelas)
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Berisi 33 sheet terpisah untuk seluruh kelas dari X-A s/d XII-K dalam 1 file master.
                      </p>
                    </div>
                    <button
                      onClick={() => { handleDownloadTemplate('all'); setShowTemplateModal(false); }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center whitespace-nowrap"
                    >
                      <HiDownload className="mr-1 text-sm" /> Unduh
                    </button>
                  </div>

                  {/* Angkatan 10 */}
                  <div className="p-3.5 rounded-xl border border-gray-200 hover:border-emerald-400 bg-gray-50/50 hover:bg-emerald-50/30 transition flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        Template Angkatan Kelas 10 (11 Sheet: X-A s/d X-K)
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        11 Sheet terbagi rapi per kelas untuk siswa baru kelas 10.
                      </p>
                    </div>
                    <button
                      onClick={() => { handleDownloadTemplate('angkatan', 'X'); setShowTemplateModal(false); }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center whitespace-nowrap"
                    >
                      <HiDownload className="mr-1" /> Unduh
                    </button>
                  </div>

                  {/* Angkatan 11 */}
                  <div className="p-3.5 rounded-xl border border-gray-200 hover:border-emerald-400 bg-gray-50/50 hover:bg-emerald-50/30 transition flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        Template Angkatan Kelas 11 (11 Sheet: XI-A s/d XI-K)
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        11 Sheet terbagi rapi untuk angkatan kelas 11.
                      </p>
                    </div>
                    <button
                      onClick={() => { handleDownloadTemplate('angkatan', 'XI'); setShowTemplateModal(false); }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center whitespace-nowrap"
                    >
                      <HiDownload className="mr-1" /> Unduh
                    </button>
                  </div>

                  {/* Angkatan 12 */}
                  <div className="p-3.5 rounded-xl border border-gray-200 hover:border-emerald-400 bg-gray-50/50 hover:bg-emerald-50/30 transition flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        Template Angkatan Kelas 12 (11 Sheet: XII-A s/d XII-K)
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        11 Sheet terbagi rapi untuk angkatan kelas 12.
                      </p>
                    </div>
                    <button
                      onClick={() => { handleDownloadTemplate('angkatan', 'XII'); setShowTemplateModal(false); }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center whitespace-nowrap"
                    >
                      <HiDownload className="mr-1" /> Unduh
                    </button>
                  </div>

                  {/* Standar 1 Sheet */}
                  <div className="p-3 rounded-xl border border-gray-200 hover:border-gray-400 bg-white transition flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-800 text-xs">
                        Template Standar (1 Sheet Campuran)
                      </div>
                      <p className="text-[11px] text-gray-500">
                        1 Lembar kerja tunggal dengan kolom NIPD, Nama, Kelas, No. HP.
                      </p>
                    </div>
                    <button
                      onClick={() => { handleDownloadTemplate('standard'); setShowTemplateModal(false); }}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-xs font-medium flex items-center whitespace-nowrap"
                    >
                      <HiDownload className="mr-1" /> Unduh
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in">
              <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-red-900 flex items-center">
                  <HiExclamationCircle className="mr-2 text-red-600 text-2xl" />
                  Konfirmasi Hapus Siswa
                </h3>
                <button
                  onClick={() => setStudentToDelete(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-white"
                >
                  <HiX className="text-xl" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Apakah Anda yakin ingin menghapus data siswa berikut?
                </p>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm space-y-1">
                  <div className="font-bold text-gray-900 text-base">{studentToDelete.name}</div>
                  <div className="text-gray-600">NIPD: <span className="font-mono font-semibold">{studentToDelete.nipd || studentToDelete.nisn}</span></div>
                  <div className="text-gray-600">Kelas: <span className="font-semibold text-indigo-600">{studentToDelete.class_name || '-'}</span></div>
                  <div className="text-gray-600">Total Poin Saat Ini: <span className="font-semibold text-red-600">{studentToDelete.total_points || 0} Poin</span></div>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start space-x-2">
                  <HiExclamation className="text-lg text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Peringatan:</strong> Menghapus data siswa ini juga akan menghapus seluruh riwayat catatan pelanggaran dan surat sanksi yang terkait.
                  </span>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setStudentToDelete(null)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition"
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
                        <HiTrash />
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
              <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-emerald-900 flex items-center">
                  <HiUpload className="mr-2 text-emerald-600 text-xl" />
                  Import Data Siswa (1 Angkatan Sekaligus)
                </h3>
                <button
                  onClick={handleCloseImportModal}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-white"
                >
                  <HiX className="text-xl" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Petunjuk Format & Download Template Angkatan */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 space-y-2">
                  <div className="font-semibold text-blue-900 flex items-center">
                    <HiDocumentText className="mr-1 text-base" /> Dukungan Import 1 Angkatan:
                  </div>
                  <p>&bull; Anda dapat mengunggah file Excel berisi 11 sheet (Kelas A s/d K) atau 1 sheet master.</p>
                  <p>&bull; Sistem otomatis mendeteksi nama sheet atau kolom <code className="bg-white px-1 py-0.5 rounded border border-blue-200">Kelas</code> dan mengimpor seluruh siswa sekaligus.</p>
                  
                  <div className="pt-2 border-t border-blue-200 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTemplateModal(true)}
                      className="text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-sm"
                    >
                      <HiDownload className="mr-1 text-sm" /> Buka Pusat Unduh Template Angkatan
                    </button>
                  </div>
                </div>

                {/* Upload File Input */}
                <form onSubmit={handleImportExcel} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Pilih File Excel yang Siap Diimpor (.xlsx / .xls)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls"
                      required
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2.5 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-emerald-50 file:text-emerald-700
                        hover:file:bg-emerald-100 cursor-pointer border border-gray-300 rounded-lg p-1"
                    />
                  </div>

                  {selectedFile && (
                    <div className="text-xs text-gray-500 flex items-center">
                      <span className="font-medium text-gray-700 mr-1">File terpilih:</span> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}

                  {/* Hasil Import Summary */}
                  {importResult && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                      <div className="flex items-center text-sm font-semibold text-gray-800">
                        <HiCheckCircle className="mr-1 text-emerald-600 text-lg" />
                        Hasil Pemrosesan:
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                          <div className="text-gray-500">Total Baris</div>
                          <div className="font-bold text-gray-800 text-base">{importResult.total_processed}</div>
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
                        <div className="mt-2 text-xs bg-white p-2.5 rounded-lg border border-gray-200 space-y-1">
                          <span className="font-semibold text-gray-700 block">Rincian Siswa Masuk per Sheet:</span>
                          <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
                            {importResult.sheet_summaries.map((s, idx) => (
                              <div key={idx} className="bg-gray-50 px-2 py-1 rounded text-[11px] flex justify-between">
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
                            <HiExclamation className="mr-1" /> Catatan Kesalahan:
                          </div>
                          {importResult.errors.map((err, idx) => (
                            <div key={idx}>&bull; {err}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleCloseImportModal}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
              <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-indigo-900 flex items-center">
                  <HiUserAdd className="mr-2 text-indigo-600 text-xl" />
                  Tambah Siswa Baru Manual
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-white"
                >
                  <HiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIPD <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nipd}
                    onChange={(e) => setFormData({ ...formData, nipd: e.target.value })}
                    placeholder="Contoh: 0012345678"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap Siswa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nama lengkap siswa"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>Kelas {c.class_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor WhatsApp / Telp Orang Tua
                  </label>
                  <input
                    type="text"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow disabled:opacity-50"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan Siswa'}
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
