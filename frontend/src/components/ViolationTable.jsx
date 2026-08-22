import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, Search, FileDown, Filter, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const ViolationTable = ({ refreshKey, onViewSanction, onEditViolation, onDeleteViolation }) => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [classes, setClasses] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  // Fetch classes for filter dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/students/classes');
        setClasses(res.data.data || []);
      } catch (err) {
        console.error('Failed to load classes for filter:', err);
      }
    };
    fetchClasses();
  }, []);

  // Fetch Violations with active filters
  const fetchViolations = async () => {
    setLoading(true);
    setSelectedIds([]);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedClass) params.append('class_id', selectedClass);
      if (selectedDate) params.append('date', selectedDate);

      const res = await api.get(`/violations?${params.toString()}`);
      setViolations(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalRecords(res.data.pagination?.total || 0);
    } catch (err) {
      toast.error('Gagal memuat data pelanggaran');
      setViolations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, [page, refreshKey, selectedClass, selectedDate]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchViolations();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResetFilter = () => {
    setSearchQuery('');
    setSelectedClass('');
    setSelectedDate('');
    setPage(1);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(violations.map(v => v.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data pelanggaran terpilih?\n\nPoin dan sanksi siswa akan dievaluasi ulang secara otomatis. Aksi ini tidak dapat dibatalkan.`);
    if (!confirmDelete) return;

    setIsDeletingBatch(true);
    const toastId = toast.loading('Menghapus data massal...');
    try {
      await api.post('/violations/batch-delete', { ids: selectedIds });
      toast.success(`${selectedIds.length} data berhasil dihapus`, { id: toastId });
      setSelectedIds([]);
      fetchViolations();
    } catch (err) {
      console.error('Batch delete error:', err);
      toast.error(err.response?.data?.message || 'Gagal menghapus data massal', { id: toastId });
    } finally {
      setIsDeletingBatch(false);
    }
  };

  // EXPORT EXCEL HANDLER
  const handleExportExcel = async () => {
    setExporting(true);
    const toastId = toast.loading('Menyiapkan file Excel pelanggaran...');
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedClass) params.append('class_id', selectedClass);
      if (selectedDate) params.append('date', selectedDate);

      const response = await api.get(`/violations/export?${params.toString()}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Laporan_Pelanggaran_Siswa_SMAN2_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('✅ File Excel berhasil diunduh!', { id: toastId });
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Gagal mengekspor file Excel', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-zinc-200">
      {/* Header & Export Toolbar */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-900">
              Daftar Riwayat Pelanggaran Siswa
            </h2>
            <span className="text-xs font-semibold text-indigo-700 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Total {totalRecords} Kasus
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Rekap riwayat catatan pelanggaran tata tertib siswa SMAN 2 Salatiga
          </p>
        </div>

        {/* Tombol Aksi Kanan */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              disabled={isDeletingBatch}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50"
              title="Hapus data terpilih"
            >
              <Trash2 className="text-lg" />
              <span>{isDeletingBatch ? 'Menghapus...' : `Hapus (${selectedIds.length}) Data`}</span>
            </button>
          )}
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50"
            title="Download Laporan Lengkap (.xlsx)"
          >
            <FileDown className="text-lg" />
            <span>{exporting ? 'Mengekspor...' : 'Export Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar: 3 Kolom Responsif */}
      <div className="p-4 border-b border-zinc-100 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-base" />
          <input
            type="text"
            placeholder="Cari siswa, NIPD, atau pelanggaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none bg-zinc-50/50 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 text-xs"
              title="Hapus pencarian"
            >
              ✕
            </button>
          )}
        </div>

        {/* 2. Filter Kelas */}
        <div>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none bg-white transition text-zinc-700 font-medium"
          >
            <option value="">-- Semua Kelas ({classes.length} Rombel) --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Kelas {c.class_name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Filter Tanggal Tunggal & Reset */}
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none bg-white transition text-zinc-700"
            title="Pilih Tanggal Pelanggaran"
          />
          {(searchQuery || selectedClass || selectedDate) && (
            <button
              onClick={handleResetFilter}
              className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition flex-shrink-0 cursor-pointer"
              title="Reset Semua Filter"
            >
              <RefreshCw className="text-sm" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Mobile View: Cards (Tampil di Layar HP) */}
      <div className="sm:hidden p-3 space-y-3">
        {violations.length > 0 && !loading && (
          <div className="flex items-center gap-2 px-1 mb-1">
            <input
              type="checkbox"
              id="selectAllMobile"
              className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              checked={selectedIds.length === violations.length}
              onChange={handleSelectAll}
            />
            <label htmlFor="selectAllMobile" className="text-xs font-semibold text-zinc-700 cursor-pointer">
              Pilih Semua ({violations.length})
            </label>
          </div>
        )}
        {loading ? (
          <div className="p-8 text-center text-zinc-400">
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-zinc-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-xs font-medium text-zinc-600">Memuat data pelanggaran...</span>
            </div>
          </div>
        ) : violations.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            <p className="text-xs font-medium">Tidak ada data pelanggaran yang sesuai filter.</p>
          </div>
        ) : (
          violations.map((v, i) => (
            <div key={v.id} className={`p-3.5 rounded-xl border shadow-sm space-y-2.5 transition ${selectedIds.includes(v.id) ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white border-zinc-200'}`}>
              {/* Header: Nama Siswa, Kelas & Poin */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                    checked={selectedIds.includes(v.id)}
                    onChange={() => handleSelectOne(v.id)}
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-zinc-900 text-xs sm:text-sm leading-tight truncate">
                      {v.student_name}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      NIPD: {v.nipd || v.nisn || '-'} &bull; Kelas: <span className="font-semibold text-indigo-700">{v.class_name || '-'}</span>
                    </div>
                  </div>
                </div>
                <span className="inline-block px-2 py-0.5 rounded font-bold text-[11px] bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
                  +{v.point_deduction} Poin
                </span>
              </div>

              {/* Bentuk Pelanggaran & Tanggal */}
              <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 space-y-1">
                <div className="text-xs font-medium text-zinc-800 leading-snug">
                  {v.category_name}
                </div>
                <div className="text-[10px] text-zinc-400">
                  Tanggal: {new Date(v.violation_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                {v.note && (
                  <div className="text-[11px] text-zinc-600 italic pt-1 border-t border-zinc-200/60 leading-relaxed">
                    "{v.note}"
                  </div>
                )}
              </div>

              {/* Tombol Aksi 3 Kolom */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <button 
                  onClick={() => onViewSanction && onViewSanction(v.student_id)}
                  className="w-full py-1.5 bg-zinc-100 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                  title="Lihat Surat Sanksi"
                >
                  <Eye className="text-sm" />
                  <span>Surat</span>
                </button>
                <button 
                  onClick={() => onEditViolation && onEditViolation(v)}
                  className="w-full py-1.5 bg-zinc-100 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                  title="Edit Data Pelanggaran"
                >
                  <Edit className="text-sm" />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={() => onDeleteViolation && onDeleteViolation(v)}
                  className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                  title="Hapus Pelanggaran Ini"
                >
                  <Trash2 className="text-sm" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View: Table (Tampil di Tablet / PC) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase font-semibold text-zinc-500 tracking-wider">
            <tr>
              <th className="px-3 py-3 w-10 text-center">
                <input
                  type="checkbox"
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  checked={violations.length > 0 && selectedIds.length === violations.length}
                  onChange={handleSelectAll}
                  title="Pilih Semua"
                />
              </th>
              <th className="px-3 py-3 text-center w-12 whitespace-nowrap">No</th>
              <th className="px-4 py-3 min-w-[160px] whitespace-nowrap">Nama Siswa</th>
              <th className="px-3 py-3 text-center w-20 whitespace-nowrap">Kelas</th>
              <th className="px-4 py-3 min-w-[200px]">Bentuk Pelanggaran</th>
              <th className="px-3 py-3 text-center w-24 whitespace-nowrap">Poin</th>
              <th className="px-3 py-3 text-center w-28 whitespace-nowrap">Tanggal</th>
              <th className="px-4 py-3 min-w-[150px]">Catatan / Kronologi</th>
              <th className="px-3 py-3 text-center w-36 whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white text-xs">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-4 py-12 text-center text-zinc-400">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-zinc-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span className="text-xs font-medium text-zinc-600">Memuat data pelanggaran...</span>
                  </div>
                </td>
              </tr>
            ) : violations.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-10 text-center text-zinc-500">
                  <p className="text-xs font-medium">Tidak ada data pelanggaran yang sesuai filter.</p>
                </td>
              </tr>
            ) : (
              violations.map((v, i) => (
                <tr key={v.id} className={`transition ${selectedIds.includes(v.id) ? 'bg-indigo-50/40' : 'hover:bg-zinc-100/40'}`}>
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={selectedIds.includes(v.id)}
                      onChange={() => handleSelectOne(v.id)}
                    />
                  </td>
                  {/* No */}
                  <td className="px-3 py-3 text-center text-zinc-500 font-semibold text-xs">
                    {(page - 1) * 10 + i + 1}
                  </td>

                  {/* Nama Siswa */}
                  <td className="px-4 py-3">
                    <div className="font-bold text-zinc-900 text-xs sm:text-sm leading-snug">
                      {v.student_name}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      NIPD: {v.nipd || v.nisn || '-'}
                    </div>
                  </td>

                  {/* Kelas */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <span className="inline-block px-2.5 py-1 rounded-md font-bold text-[11px] bg-zinc-100 text-indigo-700 border border-indigo-200">
                      {v.class_name || '-'}
                    </span>
                  </td>

                  {/* Kategori Pelanggaran */}
                  <td className="px-4 py-3 text-xs text-zinc-800 font-medium leading-relaxed">
                    {v.category_name}
                  </td>

                  {/* Poin */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <span className="inline-block px-2.5 py-1 rounded-md font-bold text-[11px] bg-red-50 text-red-700 border border-red-200">
                      +{v.point_deduction} Poin
                    </span>
                  </td>

                  {/* Tanggal */}
                  <td className="px-3 py-3 text-center text-xs text-zinc-600 whitespace-nowrap font-medium">
                    {new Date(v.violation_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>

                  {/* Catatan / Kronologi */}
                  <td className="px-4 py-3 text-xs text-zinc-700">
                    {v.note ? (
                      <div className="line-clamp-2 text-[11px] bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-200/80 leading-relaxed text-zinc-800" title={v.note}>
                        {v.note}
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-400 italic">-</span>
                    )}
                  </td>

                  {/* Aksi */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {/* Tombol Surat */}
                      <button 
                        onClick={() => onViewSanction && onViewSanction(v.student_id)}
                        className="text-indigo-700 hover:text-zinc-900 bg-zinc-100 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center shadow-sm"
                        title="Lihat Surat Sanksi"
                      >
                        <Eye className="mr-0.5 text-xs" /> Surat
                      </button>

                      {/* Tombol Edit */}
                      <button 
                        onClick={() => onEditViolation && onEditViolation(v)}
                        className="text-amber-700 hover:text-amber-900 bg-zinc-100 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center shadow-sm"
                        title="Edit Data Pelanggaran"
                      >
                        <Edit className="mr-0.5 text-xs" /> Edit
                      </button>

                      {/* Tombol Hapus */}
                      <button 
                        onClick={() => onDeleteViolation && onDeleteViolation(v)}
                        className="text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center shadow-sm"
                        title="Hapus Pelanggaran Ini"
                      >
                        <Trash2 className="mr-0.5 text-xs" /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-zinc-200 flex items-center justify-between bg-zinc-50/70 text-xs">
        <div className="text-zinc-500">
          Menampilkan <span className="font-bold text-zinc-700">{violations.length}</span> dari <span className="font-bold text-zinc-700">{totalRecords}</span> data (Hal. {page} / {totalPages})
        </div>
        <div className="flex space-x-1.5">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-40 transition text-zinc-700 font-medium flex items-center shadow-sm"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="text-sm mr-0.5" /> Prev
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-40 transition text-zinc-700 font-medium flex items-center shadow-sm"
            title="Halaman Berikutnya"
          >
            Next <ChevronRight className="text-sm ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViolationTable;

