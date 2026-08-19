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

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50/70">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-gray-800">Daftar Riwayat Pelanggaran Siswa</h2>
          <p className="text-[11px] text-gray-500">Rekap riwayat catatan pelanggaran tata tertib</p>
        </div>
        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
          Data Pelanggaran Tercatat
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500 tracking-wider">
            <tr>
              <th className="px-3 py-2.5 text-center w-10">No</th>
              <th className="px-3 py-2.5 w-40 sm:w-48">Nama Siswa</th>
              <th className="px-2 py-2.5 text-center w-16">Kelas</th>
              <th className="px-3 py-2.5 min-w-[130px]">Kategori Pelanggaran</th>
              <th className="px-2 py-2.5 text-center w-20">Poin</th>
              <th className="px-2.5 py-2.5 text-center w-24">Tanggal</th>
              <th className="px-3 py-2.5 min-w-[140px]">Catatan / Kronologi Kejadian</th>
              <th className="px-3 py-2.5 text-center w-36">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white text-xs">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-4 py-10 text-center text-gray-400">
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
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  <p className="text-xs font-medium">Belum ada data pelanggaran yang dicatat.</p>
                </td>
              </tr>
            ) : (
              violations.map((v, i) => (
                <tr key={v.id} className="hover:bg-indigo-50/40 transition">
                  {/* No */}
                  <td className="px-3 py-2.5 text-center text-gray-500 font-semibold text-xs">
                    {(page - 1) * 10 + i + 1}
                  </td>

                  {/* Nama Siswa */}
                  <td className="px-3 py-2.5">
                    <div className="font-bold text-gray-900 text-xs sm:text-sm leading-snug">
                      {v.student_name}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      NIPD: {v.nipd || v.nisn || '-'}
                    </div>
                  </td>

                  {/* Kelas */}
                  <td className="px-2 py-2.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {v.class_name || '-'}
                    </span>
                  </td>

                  {/* Kategori Pelanggaran */}
                  <td className="px-3 py-2.5 text-xs text-gray-800 font-medium leading-relaxed">
                    {v.category_name}
                  </td>

                  {/* Poin */}
                  <td className="px-2 py-2.5 text-center whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded font-bold text-[11px] bg-red-50 text-red-700 border border-red-200">
                      +{v.point_deduction} Poin
                    </span>
                  </td>

                  {/* Tanggal */}
                  <td className="px-2.5 py-2.5 text-center text-xs text-gray-600 whitespace-nowrap font-medium">
                    {new Date(v.violation_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>

                  {/* Catatan / Kronologi */}
                  <td className="px-3 py-2.5 text-xs text-gray-700">
                    {v.note ? (
                      <div className="line-clamp-2 text-[11px] bg-gray-50 px-2 py-1.5 rounded border border-gray-200/80 leading-relaxed text-gray-800" title={v.note}>
                        {v.note}
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">- Tidak ada catatan -</span>
                    )}
                  </td>

                  {/* Aksi */}
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {/* Tombol Surat */}
                      <button 
                        onClick={() => onViewSanction && onViewSanction(v.student_id)}
                        className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded text-[11px] font-semibold transition flex items-center shadow-2xs"
                        title="Lihat Surat Sanksi"
                      >
                        <HiOutlineEye className="mr-0.5 text-xs" /> Surat
                      </button>

                      {/* Tombol Edit */}
                      <button 
                        onClick={() => onEditViolation && onEditViolation(v)}
                        className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded text-[11px] font-semibold transition flex items-center shadow-2xs"
                        title="Edit Data Pelanggaran"
                      >
                        <HiOutlinePencilAlt className="mr-0.5 text-xs" /> Edit
                      </button>

                      {/* Tombol Hapus */}
                      <button 
                        onClick={() => onDeleteViolation && onDeleteViolation(v)}
                        className="text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded text-[11px] font-semibold transition flex items-center shadow-2xs"
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
          Halaman <span className="font-bold text-gray-700">{page}</span> dari <span className="font-bold text-gray-700">{totalPages}</span>
        </div>
        <div className="flex space-x-1.5">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 transition text-gray-700 font-medium flex items-center shadow-2xs"
            title="Halaman Sebelumnya"
          >
            <HiChevronLeft className="text-sm mr-0.5" /> Prev
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 transition text-gray-700 font-medium flex items-center shadow-2xs"
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

