import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  HiOutlineEye, 
  HiOutlinePencilAlt, 
  HiOutlineTrash, 
  HiChevronLeft, 
  HiChevronRight,
  HiSearch,
  HiDocumentDownload,
  HiFilter,
  HiRefresh
} from 'react-icons/hi';
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [classes, setClasses] = useState([]);
  const [exporting, setExporting] = useState(false);

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
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedClass) params.append('class_id', selectedClass);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

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
  }, [page, refreshKey, selectedClass, startDate, endDate]);

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
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // EXPORT EXCEL HANDLER
  const handleExportExcel = async () => {
    setExporting(true);
    const toastId = toast.loading('Menyiapkan file Excel pelanggaran...');
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedClass) params.append('class_id', selectedClass);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
      {/* Header & Export Toolbar */}
      <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-gray-800">
              Daftar Riwayat Pelanggaran Siswa
            </h2>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Total {totalRecords} Kasus
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Rekap riwayat catatan pelanggaran tata tertib siswa SMAN 2 Salatiga
          </p>
        </div>

        {/* Tombol Export Excel */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50"
            title="Download Laporan Lengkap (.xlsx)"
          >
            <HiDocumentDownload className="text-lg" />
            <span>{exporting ? 'Mengekspor...' : 'Export Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 border-b border-gray-100 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
          <input
            type="text"
            placeholder="Cari siswa, NIPD, atau pelanggaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50/50 focus:bg-white transition"
          />
        </div>

        {/* Filter Kelas */}
        <div>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white transition"
          >
            <option value="">-- Semua Kelas ({classes.length} Rombel) --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Kelas {c.class_name}
              </option>
            ))}
          </select>
        </div>

        {/* Tanggal Mulai */}
        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white transition text-gray-700"
            title="Filter Tanggal Mulai"
          />
        </div>

        {/* Tanggal Akhir & Reset */}
        <div className="flex gap-2">
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white transition text-gray-700"
            title="Filter Tanggal Selesai"
          />
          {(searchQuery || selectedClass || startDate || endDate) && (
            <button
              onClick={handleResetFilter}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition flex-shrink-0"
              title="Reset Semua Filter"
            >
              <HiRefresh className="text-sm" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500 tracking-wider">
            <tr>
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
          <tbody className="divide-y divide-gray-200 bg-white text-xs">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center text-gray-400">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-600">Memuat data pelanggaran...</span>
                  </div>
                </td>
              </tr>
            ) : violations.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-10 text-center text-gray-500">
                  <p className="text-xs font-medium">Tidak ada data pelanggaran yang sesuai filter.</p>
                </td>
              </tr>
            ) : (
              violations.map((v, i) => (
                <tr key={v.id} className="hover:bg-indigo-50/40 transition">
                  {/* No */}
                  <td className="px-3 py-3 text-center text-gray-500 font-semibold text-xs">
                    {(page - 1) * 10 + i + 1}
                  </td>

                  {/* Nama Siswa */}
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900 text-xs sm:text-sm leading-snug">
                      {v.student_name}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      NIPD: {v.nipd || v.nisn || '-'}
                    </div>
                  </td>

                  {/* Kelas */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <span className="inline-block px-2.5 py-1 rounded-md font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {v.class_name || '-'}
                    </span>
                  </td>

                  {/* Kategori Pelanggaran */}
                  <td className="px-4 py-3 text-xs text-gray-800 font-medium leading-relaxed">
                    {v.category_name}
                  </td>

                  {/* Poin */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <span className="inline-block px-2.5 py-1 rounded-md font-bold text-[11px] bg-red-50 text-red-700 border border-red-200">
                      +{v.point_deduction} Poin
                    </span>
                  </td>

                  {/* Tanggal */}
                  <td className="px-3 py-3 text-center text-xs text-gray-600 whitespace-nowrap font-medium">
                    {new Date(v.violation_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>

                  {/* Catatan / Kronologi */}
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {v.note ? (
                      <div className="line-clamp-2 text-[11px] bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200/80 leading-relaxed text-gray-800" title={v.note}>
                        {v.note}
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">-</span>
                    )}
                  </td>

                  {/* Aksi */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {/* Tombol Surat */}
                      <button 
                        onClick={() => onViewSanction && onViewSanction(v.student_id)}
                        className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center shadow-2xs"
                        title="Lihat Surat Sanksi"
                      >
                        <HiOutlineEye className="mr-0.5 text-xs" /> Surat
                      </button>

                      {/* Tombol Edit */}
                      <button 
                        onClick={() => onEditViolation && onEditViolation(v)}
                        className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center shadow-2xs"
                        title="Edit Data Pelanggaran"
                      >
                        <HiOutlinePencilAlt className="mr-0.5 text-xs" /> Edit
                      </button>

                      {/* Tombol Hapus */}
                      <button 
                        onClick={() => onDeleteViolation && onDeleteViolation(v)}
                        className="text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center shadow-2xs"
                        title="Hapus Pelanggaran Ini"
                      >
                        <HiOutlineTrash className="mr-0.5 text-xs" /> Hapus
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
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50/70 text-xs">
        <div className="text-gray-500">
          Menampilkan <span className="font-bold text-gray-700">{violations.length}</span> dari <span className="font-bold text-gray-700">{totalRecords}</span> data (Hal. {page} / {totalPages})
        </div>
        <div className="flex space-x-1.5">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 transition text-gray-700 font-medium flex items-center shadow-2xs"
            title="Halaman Sebelumnya"
          >
            <HiChevronLeft className="text-sm mr-0.5" /> Prev
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 transition text-gray-700 font-medium flex items-center shadow-2xs"
            title="Halaman Berikutnya"
          >
            Next <HiChevronRight className="text-sm ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViolationTable;

