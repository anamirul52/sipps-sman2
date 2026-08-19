import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  HiOutlineEye, 
  HiOutlinePencilAlt, 
  HiOutlineTrash, 
  HiChevronLeft, 
  HiChevronRight 
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const ViolationTable = ({ refreshKey, onViewSanction, onEditViolation, onDeleteViolation }) => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchViolations = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/violations?page=${page}`);
        setViolations(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } catch (err) {
        toast.error('Gagal memuat data pelanggaran');
        setViolations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchViolations();
  }, [page, refreshKey]);

  const renderStatus = (status) => {
    switch(status) {
      case 'pending': return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">Pending</span>;
      case 'processed': return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">Diproses</span>;
      case 'resolved': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">Selesai</span>;
      default: return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-800">Daftar Riwayat Pelanggaran Siswa</h2>
        <span className="text-xs text-gray-500 font-medium">Data Pelanggaran Tercatat</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">No</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[140px]">Nama Siswa</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Kelas</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">Kategori Pelanggaran</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Poin</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[180px]">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span className="text-sm">Memuat data pelanggaran...</span>
                  </div>
                </td>
              </tr>
            ) : violations.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                  <p className="text-sm">Belum ada data pelanggaran yang dicatat.</p>
                </td>
              </tr>
            ) : (
              violations.map((v, i) => (
                <tr key={v.id} className="hover:bg-indigo-50/40 transition">
                  <td className="px-5 py-3.5 text-sm text-gray-500 font-medium">{(page - 1) * 10 + i + 1}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-semibold text-gray-900">{v.student_name}</div>
                    <div className="text-xs text-gray-500 font-mono">NIPD: {v.nipd || v.nisn || '-'}</div>
                  </td>
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 min-w-[65px] whitespace-nowrap">
                      {v.class_name || '-'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 font-medium">{v.category_name}</td>
                  <td className="px-5 py-3.5 text-sm">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                      +{v.point_deduction} Poin
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {new Date(v.violation_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-5 py-3.5">{renderStatus(v.status)}</td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      {/* Tombol Surat */}
                      <button 
                        onClick={() => onViewSanction && onViewSanction(v.student_id)}
                        className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded text-xs font-medium transition flex items-center"
                        title="Lihat Surat Sanksi"
                      >
                        <HiOutlineEye className="mr-1" /> Surat
                      </button>

                      {/* Tombol Edit */}
                      <button 
                        onClick={() => onEditViolation && onEditViolation(v)}
                        className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded text-xs font-medium transition flex items-center"
                        title="Edit Data Pelanggaran"
                      >
                        <HiOutlinePencilAlt className="mr-1" /> Edit
                      </button>

                      {/* Tombol Hapus */}
                      <button 
                        onClick={() => onDeleteViolation && onDeleteViolation(v)}
                        className="text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded text-xs font-medium transition flex items-center"
                        title="Hapus Pelanggaran Ini"
                      >
                        <HiOutlineTrash className="mr-1" /> Hapus
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
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
        <div className="text-sm text-gray-500">
          Halaman <span className="font-semibold text-gray-700">{page}</span> dari <span className="font-semibold text-gray-700">{totalPages}</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition"
            title="Halaman Sebelumnya"
          >
            <HiChevronLeft className="text-base" />
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition"
            title="Halaman Berikutnya"
          >
            <HiChevronRight className="text-base" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViolationTable;
