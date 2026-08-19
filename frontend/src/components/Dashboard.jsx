import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PointBadge from './PointBadge';
import SanctionLetterModal from './SanctionLetterModal';
import { 
  HiUsers, 
  HiExclamationCircle, 
  HiExclamation,
  HiShieldCheck,
  HiClipboardList,
  HiX,
  HiArrowRight,
  HiSearch,
  HiOutlineDocumentText,
  HiOutlineEye
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayViolations: 0,
    totalViolations: 0,
    studentsNeedAttention: 0,
    todayViolationsList: [],
    allViolationsList: [],
    studentsNeedAttentionList: [],
    classesSummary: [],
    recentViolations: []
  });
  const [recentViolations, setRecentViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'students' | 'today' | 'allViolations' | 'attention' | null
  const [selectedStudentForSanction, setSelectedStudentForSanction] = useState(null);
  const [classSearch, setClassSearch] = useState('');
  const [allViolationsSearch, setAllViolationsSearch] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        const { data } = response.data;
        setStats({
          totalStudents: data.totalStudents || 0,
          todayViolations: data.todayViolations || 0,
          totalViolations: data.totalViolations || 0,
          studentsNeedAttention: data.studentsNeedAttention || 0,
          todayViolationsList: data.todayViolationsList || [],
          allViolationsList: data.allViolationsList || [],
          studentsNeedAttentionList: data.studentsNeedAttentionList || [],
          classesSummary: data.classesSummary || [],
          recentViolations: data.recentViolations || []
        });
        setRecentViolations(data.recentViolations || []);
      } catch (error) {
        toast.error('Gagal memuat data dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 7 Jenjang Sanksi Resmi
  const sanctionTiers = [
    {
      range: '0 – 10 Poin',
      sanction: 'Penyelesaian Langsung',
      officer: 'Guru yang bersangkutan dan Wali Kelas',
      note: 'Pembinaan di kelas / langsung',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    {
      range: '11 – 20 Poin',
      sanction: 'Penyelesaian Langsung',
      officer: 'Wali Kelas',
      note: 'Pemberitahuan kepada orang tua/wali',
      color: 'bg-sky-50 text-sky-800 border-sky-200'
    },
    {
      range: '21 – 25 Poin',
      sanction: 'Peringatan Tertulis I (SP 1)',
      officer: 'Wali Kelas dan BK',
      note: 'Pemanggilan orang tua/wali',
      color: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      range: '26 – 50 Poin',
      sanction: 'Peringatan Tertulis II (SP 2)',
      officer: 'Wali Kelas dan BK',
      note: 'Pemanggilan orang tua/wali',
      color: 'bg-orange-50 text-orange-800 border-orange-200'
    },
    {
      range: '51 – 75 Poin',
      sanction: 'Peringatan Tertulis III & Surat Pernyataan Bermaterai',
      officer: 'Wali Kelas, BK, Kesiswaan, dan Kepala Sekolah',
      note: 'Pemanggilan orang tua/wali',
      color: 'bg-rose-50 text-rose-800 border-rose-200'
    },
    {
      range: '76 – 99 Poin',
      sanction: 'Pemberian Skorsing',
      officer: 'Wali Kelas, BK, Kesiswaan, dan Kepala Sekolah',
      note: 'Pemanggilan orang tua/wali',
      color: 'bg-red-100 text-red-800 border-red-300'
    },
    {
      range: '≥ 100 Poin',
      sanction: 'Orang Tua/Wali Menarik Kembali Siswa dari Sekolah',
      officer: 'Kepala Sekolah',
      note: 'Pengembalian siswa kepada orang tua/wali',
      color: 'bg-red-800 text-white border-red-900'
    }
  ];

  const filteredClasses = stats.classesSummary.filter(c => 
    c.class_name.toLowerCase().includes(classSearch.toLowerCase())
  );

  const filteredAllViolations = stats.allViolationsList.filter(v => 
    (v.student_name || '').toLowerCase().includes(allViolationsSearch.toLowerCase()) ||
    (v.nipd || '').toLowerCase().includes(allViolationsSearch.toLowerCase()) ||
    (v.class_name || '').toLowerCase().includes(allViolationsSearch.toLowerCase()) ||
    (v.category_name || '').toLowerCase().includes(allViolationsSearch.toLowerCase()) ||
    (v.note || '').toLowerCase().includes(allViolationsSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 rounded-2xl h-32" />
          ))}
        </div>
        <div className="bg-gray-200 rounded-2xl h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Monitoring BK</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            SMA Negeri 2 Salatiga &bull; Rekapitulasi Pelanggaran & Tindakan Sanksi
          </p>
        </div>
      </div>
      
      {/* Stat Cards Section - Clickable 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: Total Siswa */}
        <div 
          onClick={() => setActiveModal('students')}
          className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl shadow-md p-5 text-white transition-all transform hover:-translate-y-1 hover:shadow-xl cursor-pointer group select-none relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 font-semibold text-xs sm:text-sm">Total Siswa Terdaftar</p>
              <p className="text-3xl sm:text-4xl font-extrabold mt-1 tracking-tight">{stats.totalStudents}</p>
            </div>
            <div className="bg-white/15 p-3 rounded-xl border border-white/20 group-hover:scale-110 transition">
              <HiUsers className="text-2xl text-white" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-indigo-100 font-medium">
            <span>Lihat data & rombel</span>
            <HiArrowRight className="group-hover:translate-x-1 transition text-xs" />
          </div>
        </div>

        {/* Card 2: Pelanggaran Hari Ini */}
        <div 
          onClick={() => setActiveModal('today')}
          className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-md p-5 text-white transition-all transform hover:-translate-y-1 hover:shadow-xl cursor-pointer group select-none relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 font-semibold text-xs sm:text-sm">Pelanggaran Hari Ini</p>
              <p className="text-3xl sm:text-4xl font-extrabold mt-1 tracking-tight">{stats.todayViolations}</p>
            </div>
            <div className="bg-white/15 p-3 rounded-xl border border-white/20 group-hover:scale-110 transition">
              <HiExclamationCircle className="text-2xl text-white" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-amber-100 font-medium">
            <span>Rincian hari ini</span>
            <HiArrowRight className="group-hover:translate-x-1 transition text-xs" />
          </div>
        </div>

        {/* Card 3: Semua Pelanggaran */}
        <div 
          onClick={() => setActiveModal('allViolations')}
          className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl shadow-md p-5 text-white transition-all transform hover:-translate-y-1 hover:shadow-xl cursor-pointer group select-none relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 font-semibold text-xs sm:text-sm">Semua Pelanggaran</p>
              <p className="text-3xl sm:text-4xl font-extrabold mt-1 tracking-tight">{stats.totalViolations}</p>
            </div>
            <div className="bg-white/15 p-3 rounded-xl border border-white/20 group-hover:scale-110 transition">
              <HiClipboardList className="text-2xl text-white" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-purple-100 font-medium">
            <span>Lihat seluruh riwayat</span>
            <HiArrowRight className="group-hover:translate-x-1 transition text-xs" />
          </div>
        </div>

        {/* Card 4: Perlu Penanganan (>= 21 Poin) */}
        <div 
          onClick={() => setActiveModal('attention')}
          className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-2xl shadow-md p-5 text-white transition-all transform hover:-translate-y-1 hover:shadow-xl cursor-pointer group select-none relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 font-semibold text-xs sm:text-sm">Perlu Penanganan (≥21 Poin)</p>
              <p className="text-3xl sm:text-4xl font-extrabold mt-1 tracking-tight">{stats.studentsNeedAttention}</p>
            </div>
            <div className="bg-white/15 p-3 rounded-xl border border-white/20 group-hover:scale-110 transition">
              <HiExclamation className="text-2xl text-white" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-rose-100 font-medium">
            <span>Daftar & cetak sanksi</span>
            <HiArrowRight className="group-hover:translate-x-1 transition text-xs" />
          </div>
        </div>
      </div>



      {/* Tabel Pelanggaran Terbaru */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50/70">
          <h2 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
            <HiClipboardList className="text-indigo-600 text-base sm:text-lg" />
            Pelanggaran Terbaru Masuk
          </h2>
          <span className="text-[11px] text-gray-500 font-semibold bg-gray-200/70 px-2.5 py-0.5 rounded-full">
            10 Catatan Terkini
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500 tracking-wider">
              <tr>
                <th className="px-3 py-2.5 text-center w-10">No</th>
                <th className="px-3 py-2.5 w-44 sm:w-52">Nama Siswa</th>
                <th className="px-2 py-2.5 text-center w-16">Kelas</th>
                <th className="px-3 py-2.5 min-w-[130px]">Kategori Pelanggaran</th>
                <th className="px-2 py-2.5 text-center w-20">Poin</th>
                <th className="px-3 py-2.5 text-center w-40">Akumulasi Poin</th>
                <th className="px-2.5 py-2.5 text-center w-24">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white text-xs">
              {recentViolations.map((v, index) => (
                <tr key={v.id} className="hover:bg-indigo-50/40 transition">
                  <td className="px-3 py-2.5 text-center text-gray-500 font-semibold text-xs">{index + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-bold text-gray-900 text-xs sm:text-sm leading-snug">{v.student_name}</div>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {v.class_name || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-800 font-medium leading-relaxed">
                    {v.category_name}
                  </td>
                  <td className="px-2 py-2.5 text-center whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded font-bold text-[11px] bg-red-50 text-red-700 border border-red-200">
                      +{v.point_deduction} Poin
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <PointBadge points={v.student_total_points} />
                  </td>
                  <td className="px-2.5 py-2.5 text-center text-xs text-gray-600 whitespace-nowrap font-medium">
                    {new Date(v.violation_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
              {recentViolations.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-xs text-gray-500">
                    Belum ada data pelanggaran hari ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pedoman Sanksi Berdasarkan Total Poin */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
            <HiShieldCheck className="text-indigo-600 text-base sm:text-lg" />
            Pedoman Daftar Sanksi Berdasarkan Total Poin
          </h2>
          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 w-fit">
            7 Jenjang Tindakan Resmi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500 tracking-wider">
              <tr>
                <th className="px-3 py-2.5 w-32 text-left">Rentang Poin</th>
                <th className="px-3 py-2.5 w-56 text-left">Tindakan / Sanksi</th>
                <th className="px-3 py-2.5 min-w-[150px] text-left">Petugas Penanggung Jawab</th>
                <th className="px-3 py-2.5 min-w-[150px] text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sanctionTiers.map((tier, idx) => (
                <tr key={idx} className="hover:bg-gray-50/80 transition">
                  <td className="px-3 py-2.5 font-mono font-bold text-gray-900 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-md border ${tier.color} inline-block font-semibold text-[11px]`}>
                      {tier.range}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-bold text-gray-900 text-xs">
                    {tier.sanction}
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 font-medium text-xs leading-relaxed">
                    {tier.officer}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 text-xs leading-relaxed">
                    {tier.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL DETAIL 1: TOTAL SISWA & ROMBEL KELAS ================= */}
      {activeModal === 'students' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-indigo-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <HiUsers className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Rincian Data Siswa & Rombel Kelas</h3>
                  <p className="text-xs text-gray-500">Total {stats.totalStudents} siswa terdaftar di {stats.classesSummary.length} rombel kelas</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-full hover:bg-white"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Search input */}
              <div className="relative">
                <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  type="text"
                  placeholder="Cari nama kelas (misal: X-A, XI-I, XII-MIPA)..."
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Classes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredClasses.map((c) => (
                  <div 
                    key={c.id}
                    className="p-3 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-indigo-50/50 hover:border-indigo-200 transition flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-gray-900">{c.class_name}</span>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                        {c.student_count} Siswa
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500 flex items-center justify-between">
                      <span>Pelanggar:</span>
                      <span className={`font-bold ${c.students_with_violations > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {c.students_with_violations} Siswa
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <button
                onClick={() => {
                  setActiveModal(null);
                  navigate('/students');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span>Buka Menu Data Siswa Lengkap</span>
                <HiArrowRight className="text-sm" />
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition text-xs sm:text-sm font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL 2: PELANGGARAN HARI INI ================= */}
      {activeModal === 'today' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-amber-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl">
                  <HiExclamationCircle className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Rincian Pelanggaran Masuk Hari Ini</h3>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} &bull; Total {stats.todayViolations} Kasus
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-full hover:bg-white"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {stats.todayViolationsList.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <HiShieldCheck className="text-4xl text-emerald-500 mx-auto" />
                  <div className="font-bold text-gray-800 text-sm">Tidak ada pelanggaran tercatat hari ini</div>
                  <p className="text-xs text-gray-400">Seluruh siswa tertib mematuhi tata tertib sekolah hari ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500 tracking-wider">
                      <tr>
                        <th className="px-3 py-3 text-center w-12 whitespace-nowrap">No</th>
                        <th className="px-4 py-3 min-w-[160px] whitespace-nowrap">Nama Siswa</th>
                        <th className="px-3 py-3 text-center w-20 whitespace-nowrap">Kelas</th>
                        <th className="px-4 py-3 min-w-[200px]">Bentuk Pelanggaran</th>
                        <th className="px-3 py-3 text-center w-24 whitespace-nowrap">Poin</th>
                        <th className="px-4 py-3 text-center w-40 whitespace-nowrap">Akumulasi Poin</th>
                        <th className="px-3 py-3 text-center w-24 whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {stats.todayViolationsList.map((v, i) => (
                        <tr key={v.id} className="hover:bg-amber-50/30 transition">
                          <td className="px-3 py-3 text-center text-gray-500 font-semibold">{i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900 text-xs sm:text-sm leading-snug">{v.student_name}</div>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">NIPD: {v.nipd || '-'}</div>
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 rounded-md font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {v.class_name || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-800 font-medium leading-relaxed">
                            {v.category_name}
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 rounded-md font-bold text-[11px] bg-red-50 text-red-700 border border-red-200">
                              +{v.point_deduction} Poin
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <PointBadge points={v.student_total_points} />
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedStudentForSanction(v.student_id);
                              }}
                              className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1 shadow-2xs"
                              title="Lihat Surat Sanksi"
                            >
                              <HiOutlineEye className="text-xs" /> Surat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <button
                onClick={() => {
                  setActiveModal(null);
                  navigate('/violations');
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span>Buka Menu Pelanggaran Lengkap</span>
                <HiArrowRight className="text-sm" />
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition text-xs sm:text-sm font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL 3: SEMUA PELANGGARAN ================= */}
      {activeModal === 'allViolations' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-purple-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 text-white rounded-xl">
                  <HiClipboardList className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Rekapitulasi Seluruh Pelanggaran Tercatat</h3>
                  <p className="text-xs text-gray-500">
                    Total {stats.totalViolations} kasus pelanggaran yang tersimpan di sistem &bull; Rekap akumulasi poin siswa
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-full hover:bg-white"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Search input */}
              <div className="relative">
                <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  type="text"
                  placeholder="Cari nama siswa, NIPD, kelas, atau jenis pelanggaran..."
                  value={allViolationsSearch}
                  onChange={(e) => setAllViolationsSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50/50 focus:bg-white transition"
                />
              </div>

              {stats.allViolationsList.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <HiShieldCheck className="text-4xl text-emerald-500 mx-auto" />
                  <div className="font-bold text-gray-800 text-sm">Belum ada riwayat pelanggaran tercatat</div>
                  <p className="text-xs text-gray-400">Database pelanggaran masih bersih.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500 tracking-wider">
                      <tr>
                        <th className="px-3 py-3 text-center w-12 whitespace-nowrap">No</th>
                        <th className="px-4 py-3 min-w-[160px] whitespace-nowrap">Nama Siswa</th>
                        <th className="px-3 py-3 text-center w-20 whitespace-nowrap">Kelas</th>
                        <th className="px-4 py-3 min-w-[200px]">Bentuk Pelanggaran</th>
                        <th className="px-3 py-3 text-center w-24 whitespace-nowrap">Poin</th>
                        <th className="px-4 py-3 text-center w-40 whitespace-nowrap">Akumulasi Poin</th>
                        <th className="px-3 py-3 text-center w-28 whitespace-nowrap">Tanggal</th>
                        <th className="px-3 py-3 text-center w-24 whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredAllViolations.map((v, i) => (
                        <tr key={v.id} className="hover:bg-purple-50/30 transition">
                          <td className="px-3 py-3 text-center text-gray-500 font-semibold">{i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900 text-xs sm:text-sm leading-snug">{v.student_name}</div>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">NIPD: {v.nipd || '-'}</div>
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 rounded-md font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {v.class_name || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-800 font-medium leading-relaxed">
                            {v.category_name}
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 rounded-md font-bold text-[11px] bg-red-50 text-red-700 border border-red-200">
                              +{v.point_deduction} Poin
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <PointBadge points={v.student_total_points} />
                          </td>
                          <td className="px-3 py-3 text-center text-gray-600 whitespace-nowrap font-medium text-[11px]">
                            {new Date(v.violation_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedStudentForSanction(v.student_id);
                              }}
                              className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1 shadow-2xs"
                              title="Lihat Surat Sanksi"
                            >
                              <HiOutlineEye className="text-xs" /> Surat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <button
                onClick={() => {
                  setActiveModal(null);
                  navigate('/violations');
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span>Buka Menu Pelanggaran Lengkap</span>
                <HiArrowRight className="text-sm" />
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition text-xs sm:text-sm font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ================= MODAL DETAIL 4: PERLU PENANGANAN (>= 21 POIN) ================= */}
      {activeModal === 'attention' && (

        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-rose-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-600 text-white rounded-xl">
                  <HiExclamation className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Daftar Siswa Perlu Penanganan Khusus</h3>
                  <p className="text-xs text-gray-500">Siswa dengan akumulasi &ge; 21 Poin yang telah mencapai ambang batas sanksi resmi</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-full hover:bg-white"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {stats.studentsNeedAttentionList.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <HiShieldCheck className="text-4xl text-emerald-500 mx-auto" />
                  <div className="font-bold text-gray-800 text-sm">Tidak ada siswa yang mencapai &ge;21 Poin</div>
                  <p className="text-xs text-gray-400">Seluruh siswa berada dalam batas aman tata tertib sekolah.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500">
                      <tr>
                        <th className="px-3 py-2.5 text-center w-10">No</th>
                        <th className="px-3 py-2.5 w-44">Nama Siswa</th>
                        <th className="px-2 py-2.5 text-center w-16">Kelas</th>
                        <th className="px-3 py-2.5 text-center w-40">Status Akumulasi Poin</th>
                        <th className="px-3 py-2.5 text-center w-36">Aksi Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {stats.studentsNeedAttentionList.map((s, i) => (
                        <tr key={s.id} className="hover:bg-rose-50/30 transition">
                          <td className="px-3 py-2.5 text-center text-gray-500 font-semibold">{i + 1}</td>
                          <td className="px-3 py-2.5">
                            <div className="font-bold text-gray-900">{s.student_name}</div>
                            <div className="text-[10px] text-gray-500 font-mono">NIPD: {s.nipd || '-'}</div>
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <span className="inline-block px-2 py-0.5 rounded font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {s.class_name || '-'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <PointBadge points={s.total_points} />
                          </td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <button
                              onClick={() => setSelectedStudentForSanction(s.id)}
                              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition inline-flex items-center gap-1 shadow-2xs"
                              title="Lihat & Cetak Surat Sanksi"
                            >
                              <HiOutlineDocumentText className="text-xs" /> Lihat Surat Sanksi
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <button
                onClick={() => {
                  setActiveModal(null);
                  navigate('/students');
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span>Buka Menu Data Siswa</span>
                <HiArrowRight className="text-sm" />
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition text-xs sm:text-sm font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sanction Letter Modal (Direct Trigger from Dashboard) */}
      {selectedStudentForSanction && (
        <SanctionLetterModal
          studentId={selectedStudentForSanction}
          onClose={() => setSelectedStudentForSanction(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;

