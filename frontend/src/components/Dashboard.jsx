import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PointBadge from './PointBadge';
import SanctionLetterModal from './SanctionLetterModal';
import { Users, AlertCircle, AlertTriangle, ShieldCheck, ClipboardList, X, ArrowRight, ArrowLeft, Search, FileText, Eye, FileDown, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayViolations: 0,
    totalViolations: 0,
    studentsNeedAttention: 0,
    todayViolationsList: [],
    studentsNeedAttentionList: [],
    classesSummary: [],
    recentViolations: []
  });
  const [recentViolations, setRecentViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lazy Load State
  const [allViolationsData, setAllViolationsData] = useState([]);
  const [loadingAllViolations, setLoadingAllViolations] = useState(false);

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'students' | 'today' | 'allViolations' | 'attention' | null
  const [selectedStudentForSanction, setSelectedStudentForSanction] = useState(null);
  const [classSearch, setClassSearch] = useState('');
  const [allViolationsSearch, setAllViolationsSearch] = useState('');
  const [allViolationsGradeFilter, setAllViolationsGradeFilter] = useState('ALL'); // 'ALL' | 'X' | 'XI' | 'XII'
  const [allViolationsClassFilter, setAllViolationsClassFilter] = useState('');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);

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

  const handleOpenAllViolations = async () => {
    setActiveModal('allViolations');
    if (allViolationsData.length === 0) {
      setLoadingAllViolations(true);
      try {
        const response = await api.get('/dashboard/all-violations');
        setAllViolationsData(response.data.data || []);
      } catch (err) {
        toast.error('Gagal memuat rincian data seluruh pelanggaran');
      } finally {
        setLoadingAllViolations(false);
      }
    }
  };

  const handleExportViolations = async () => {
    const toastId = toast.loading('Menyiapkan file Excel pelanggaran...');
    try {
      const response = await api.get('/violations/export', { responseType: 'blob' });
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
      toast.error('Gagal mengekspor data pelanggaran', { id: toastId });
    }
  };

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
      color: 'bg-zinc-100 text-amber-800 border-amber-200'
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

  // Grouping data pelanggaran berdasarkan siswa
  const groupedStudentsMap = new Map();
  allViolationsData.forEach(v => {
    const studentId = v.student_id;
    if (!groupedStudentsMap.has(studentId)) {
      groupedStudentsMap.set(studentId, {
        student_id: v.student_id,
        student_name: v.student_name,
        nipd: v.nipd,
        class_name: v.class_name,
        student_total_points: v.student_total_points,
        violations: []
      });
    }
    groupedStudentsMap.get(studentId).violations.push(v);
  });

  const groupedStudentsList = Array.from(groupedStudentsMap.values());

  // Perhitungan Kategori Kelas untuk Modal Rekapitulasi
  const totalAllViolationsCount = allViolationsData.length;
  const totalViolatorsCount = groupedStudentsList.length;
  const gradeXCount = groupedStudentsList.filter(s => (s.class_name || '').startsWith('X-')).length;
  const gradeXICount = groupedStudentsList.filter(s => (s.class_name || '').startsWith('XI-')).length;
  const gradeXIICount = groupedStudentsList.filter(s => (s.class_name || '').startsWith('XII-')).length;

  const availableClassesForFilter = stats.classesSummary.length > 0
    ? stats.classesSummary.filter(c => allViolationsGradeFilter === 'ALL' || c.class_name.startsWith(allViolationsGradeFilter + '-'))
    : [];

  const filteredGroupedStudents = groupedStudentsList.filter(s => {
    const text = allViolationsSearch.toLowerCase();
    const matchesSearch = !text || (
      (s.student_name || '').toLowerCase().includes(text) ||
      (s.nipd || '').toLowerCase().includes(text) ||
      (s.class_name || '').toLowerCase().includes(text) ||
      s.violations.some(v => (v.category_name || '').toLowerCase().includes(text) || (v.note || '').toLowerCase().includes(text))
    );

    const className = s.class_name || '';
    const matchesGrade = allViolationsGradeFilter === 'ALL' || className.startsWith(allViolationsGradeFilter + '-');
    const matchesClass = !allViolationsClassFilter || className === allViolationsClassFilter;

    return matchesSearch && matchesGrade && matchesClass;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-zinc-200 rounded-lg w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-zinc-200 rounded-2xl h-32" />
          ))}
        </div>
        <div className="bg-zinc-200 rounded-2xl h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">Dashboard Monitoring Pelanggaran Siswa</h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Rekapitulasi Pelanggaran & Tindakan Sanksi
          </p>
        </div>
      </div>
      
      {/* Stat Cards Section - Clickable 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Total Siswa */}
        <div 
          onClick={() => setActiveModal('students')}
          className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5 sm:p-6 transition-all hover:bg-zinc-50 hover:border-zinc-300 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 font-medium text-xs sm:text-sm">Total Siswa Terdaftar</p>
              <p className="text-3xl sm:text-4xl font-medium tracking-tight text-zinc-900 mt-2">{stats.totalStudents}</p>
            </div>
            <div className="bg-zinc-100 p-2.5 sm:p-3 rounded-lg text-zinc-600  transition-transform">
              <Users className="text-xl sm:text-2xl" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Lihat data & rombel</span>
            <ArrowRight className="text-zinc-400 group-hover:translate-x-0.5 group-hover:text-zinc-600 transition-all" />
          </div>
        </div>

        {/* Card 2: Pelanggaran Hari Ini */}
        <div 
          onClick={() => setActiveModal('today')}
          className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5 sm:p-6 transition-all hover:bg-zinc-50 hover:border-zinc-300 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 font-medium text-xs sm:text-sm">Pelanggaran Hari Ini</p>
              <p className="text-3xl sm:text-4xl font-medium tracking-tight text-zinc-900 mt-2">{stats.todayViolations}</p>
            </div>
            <div className="bg-zinc-100 p-2.5 sm:p-3 rounded-lg text-zinc-600  transition-transform">
              <AlertCircle className="text-xl sm:text-2xl" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Rincian hari ini</span>
            <ArrowRight className="text-zinc-400 group-hover:translate-x-0.5 group-hover:text-zinc-600 transition-all" />
          </div>
        </div>

        {/* Card 3: Semua Pelanggaran */}
        <div 
          onClick={handleOpenAllViolations}
          className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5 sm:p-6 transition-all hover:bg-zinc-50 hover:border-zinc-300 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 font-medium text-xs sm:text-sm">Semua Pelanggaran</p>
              <p className="text-3xl sm:text-4xl font-medium tracking-tight text-zinc-900 mt-2">{stats.totalViolations}</p>
            </div>
            <div className="bg-zinc-100 p-2.5 sm:p-3 rounded-lg text-zinc-600  transition-transform">
              <ClipboardList className="text-xl sm:text-2xl" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Lihat seluruh riwayat</span>
            <ArrowRight className="text-zinc-400 group-hover:translate-x-0.5 group-hover:text-zinc-600 transition-all" />
          </div>
        </div>

        {/* Card 4: Perlu Penanganan (>= 21 Poin) */}
        <div 
          onClick={() => setActiveModal('attention')}
          className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5 sm:p-6 transition-all hover:bg-zinc-50 hover:border-zinc-300 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 font-medium text-xs sm:text-sm">Perlu Penanganan</p>
              <p className="text-3xl sm:text-4xl font-medium tracking-tight text-rose-600 mt-2">{stats.studentsNeedAttention}</p>
            </div>
            <div className="bg-rose-50 p-2.5 sm:p-3 rounded-lg text-rose-600  transition-transform">
              <AlertTriangle className="text-xl sm:text-2xl" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Daftar & cetak sanksi</span>
            <ArrowRight className="text-zinc-400 group-hover:translate-x-0.5 group-hover:text-rose-600 transition-all" />
          </div>
        </div>
      </div>



      {/* Tabel Pelanggaran Terbaru */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-zinc-200">
        <div className="px-4 py-4 border-b border-zinc-200 flex justify-between items-center bg-white">
          <h2 className="text-sm sm:text-base font-semibold text-zinc-900 flex items-center gap-2">
            <ClipboardList className="text-zinc-600 text-base sm:text-lg" />
            Pelanggaran Terbaru Masuk
          </h2>
          <span className="text-[11px] text-zinc-500 font-medium bg-zinc-100 px-2.5 py-0.5 rounded-full">
            10 Catatan Terkini
          </span>
        </div>
        
        {/* Mobile View: Cards (Tampil di Layar HP) */}
        <div className="sm:hidden p-4 space-y-3">
          {recentViolations.map((v, index) => (
            <div key={v.id} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-zinc-900 text-xs">{v.student_name}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Kelas: <span className="font-medium text-zinc-700">{v.class_name || '-'}</span>
                  </div>
                </div>
                <PointBadge points={v.student_total_points} />
              </div>
              <div className="text-xs text-zinc-700 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 flex items-center justify-between gap-2">
                <span className="font-medium text-[11px]">{v.category_name}</span>
                <span className="font-semibold text-red-600 text-[11px] whitespace-nowrap">+{v.point_deduction} Poin</span>
              </div>
              <div className="text-[10px] text-zinc-400 text-right">
                {new Date(v.violation_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
          {recentViolations.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-500">
              Belum ada data pelanggaran hari ini.
            </div>
          )}
        </div>

        {/* Desktop View: Table (Tampil di Tablet/PC) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase font-semibold text-zinc-500 tracking-wider">
              <tr>
                <th className="px-4 py-3 text-center w-10 whitespace-nowrap">No</th>
                <th className="px-4 py-3 min-w-[150px] whitespace-nowrap">Nama Siswa</th>
                <th className="px-4 py-3 text-center min-w-[80px] whitespace-nowrap">Kelas</th>
                <th className="px-4 py-3 min-w-[180px]">Kategori Pelanggaran</th>
                <th className="px-4 py-3 text-center min-w-[75px] whitespace-nowrap">Poin</th>
                <th className="px-4 py-3 text-center min-w-[140px] whitespace-nowrap">Akumulasi Poin</th>
                <th className="px-4 py-3 text-center min-w-[95px] whitespace-nowrap">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white text-xs">
              {recentViolations.map((v, index) => (
                <tr key={v.id} className="hover:bg-zinc-50/50 transition">
                  <td className="px-4 py-3 text-center text-zinc-500 font-medium text-xs whitespace-nowrap">{index + 1}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold text-zinc-900 text-xs sm:text-sm leading-snug">{v.student_name}</div>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md font-medium text-[11px] bg-zinc-100 text-zinc-700 border border-zinc-200 whitespace-nowrap min-w-[55px]">
                      {v.class_name || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-700 font-medium leading-relaxed">
                    {v.category_name}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded font-medium text-[11px] bg-red-50 text-red-700 border border-red-100 whitespace-nowrap">
                      +{v.point_deduction} Poin
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <PointBadge points={v.student_total_points} />
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-zinc-500 whitespace-nowrap font-medium">
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
                  <td colSpan="7" className="px-4 py-8 text-center text-xs text-zinc-500">
                    Belum ada data pelanggaran hari ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pedoman Sanksi Berdasarkan Total Poin */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-zinc-200">
        <div className="px-4 py-4 border-b border-zinc-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-semibold text-zinc-900 flex items-center gap-2">
            <ShieldCheck className="text-zinc-600 text-base sm:text-lg" />
            Pedoman Daftar Sanksi Berdasarkan Total Poin
          </h2>
          <span className="text-[11px] font-semibold text-indigo-700 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-indigo-200 w-fit">
            7 Jenjang Tindakan Resmi
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="sm:hidden p-3 space-y-2.5">
          {sanctionTiers.map((tier, idx) => (
            <div key={idx} className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2 py-0.5 rounded-md border ${tier.color} font-mono font-bold text-[11px]`}>
                  {tier.range}
                </span>
                <span className="text-xs font-bold text-zinc-900">{tier.sanction}</span>
              </div>
              <div className="text-[11px] text-zinc-600">
                <span className="font-semibold text-zinc-700">Petugas:</span> {tier.officer}
              </div>
              {tier.note && (
                <div className="text-[10px] text-zinc-500 bg-zinc-50 p-1.5 rounded border border-zinc-100">
                  {tier.note}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase font-semibold text-zinc-500 tracking-wider tracking-wider">
              <tr>
                <th className="px-3 py-2.5 w-32 text-left">Rentang Poin</th>
                <th className="px-3 py-2.5 w-56 text-left">Tindakan / Sanksi</th>
                <th className="px-3 py-2.5 min-w-[150px] text-left">Petugas Penanggung Jawab</th>
                <th className="px-3 py-2.5 min-w-[150px] text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {sanctionTiers.map((tier, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/80 transition">
                  <td className="px-3 py-2.5 font-mono font-bold text-zinc-900 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-md border ${tier.color} inline-block font-semibold text-[11px]`}>
                      {tier.range}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-bold text-zinc-900 text-xs">
                    {tier.sanction}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-700 font-medium text-xs leading-relaxed">
                    {tier.officer}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-600 text-xs leading-relaxed">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-100/80">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-2 bg-zinc-900 text-white rounded-xl flex-shrink-0">
                  <Users className="text-lg sm:text-xl" />
                </div>
                <div className="truncate">
                  <h3 className="text-sm sm:text-lg font-bold text-zinc-900 truncate">Rincian Data Siswa & Rombel</h3>
                  <p className="text-[11px] sm:text-xs text-zinc-500 truncate">Total {stats.totalStudents} siswa terdaftar di {stats.classesSummary.length} rombel kelas</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-zinc-400 hover:text-zinc-600 transition p-1.5 rounded-full hover:bg-white flex-shrink-0"
              >
                <X className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-base" />
                <input
                  type="text"
                  placeholder="Cari nama kelas (misal: X-A, XI-I, XII-MIPA)..."
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
                />
              </div>

              {/* Classes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredClasses.map((c) => (
                  <div 
                    key={c.id}
                    onClick={() => {
                      setActiveModal(null);
                      const grade = c.class_name.split('-')[0];
                      navigate('/students', { state: { gradeFilter: grade, selectedClass: c.id } });
                    }}
                    className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100/50 hover:border-indigo-300 transition flex flex-col justify-between cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-zinc-900">{c.class_name}</span>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                        {c.student_count} Siswa
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] text-zinc-500 flex items-center justify-between">
                      <span>Pelanggar:</span>
                      <span className={`font-bold ${c.students_with_violations > 0 ? 'text-zinc-600' : 'text-emerald-600'}`}>
                        {c.students_with_violations} Siswa
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-zinc-200 bg-zinc-50 flex justify-between items-center">
              <button
                onClick={() => {
                  setActiveModal(null);
                  navigate('/students');
                }}
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span>Buka Menu Data Siswa Lengkap</span>
                <ArrowRight className="text-sm" />
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-700 hover:bg-zinc-100 transition text-xs sm:text-sm font-medium"
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-100/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl">
                  <AlertCircle className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900">Rincian Pelanggaran Masuk Hari Ini</h3>
                  <p className="text-xs text-zinc-500">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} &bull; Total {stats.todayViolations} Kasus
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-zinc-400 hover:text-zinc-600 transition p-1.5 rounded-full hover:bg-white"
              >
                <X className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {stats.todayViolationsList.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <ShieldCheck className="text-4xl text-emerald-500 mx-auto" />
                  <div className="font-bold text-zinc-800 text-sm">Tidak ada pelanggaran tercatat hari ini</div>
                  <p className="text-xs text-zinc-400">Seluruh siswa tertib mematuhi tata tertib sekolah hari ini.</p>
                </div>
              ) : (
                <>
                  {/* Mobile View: Cards */}
                  <div className="sm:hidden space-y-3">
                    {stats.todayViolationsList.map((v, i) => (
                      <div key={v.id} className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-zinc-900 text-xs sm:text-sm leading-tight truncate">{v.student_name}</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              NIPD: {v.nipd || '-'} &bull; Kelas: <span className="font-semibold text-indigo-700">{v.class_name || '-'}</span>
                            </div>
                          </div>
                          <PointBadge points={v.student_total_points} />
                        </div>
                        <div className="text-xs text-zinc-800 bg-zinc-100/60 p-2.5 rounded-lg border border-amber-100 flex items-center justify-between gap-2">
                          <span className="font-medium text-[11px] leading-snug">{v.category_name}</span>
                          <span className="font-bold text-red-600 text-[11px] whitespace-nowrap">+{v.point_deduction} Poin</span>
                        </div>
                        <div className="pt-1">
                          <button
                            onClick={() => setSelectedStudentForSanction(v.student_id)}
                            className="w-full py-2 bg-zinc-100 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <FileText className="text-sm" />
                            <span>Lihat Surat Sanksi</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="hidden sm:block overflow-hidden border border-zinc-200 rounded-xl shadow-sm">
                    <table className="w-full text-left border-collapse text-xs table-fixed">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase font-semibold text-zinc-500 tracking-wider tracking-wider">
                        <tr>
                          <th className="px-2 py-3 text-center w-10">No</th>
                          <th className="px-3 py-3 w-[25%]">Nama Siswa</th>
                          <th className="px-2 py-3 text-center w-16">Kelas</th>
                          <th className="px-3 py-3 w-[26%]">Bentuk Pelanggaran</th>
                          <th className="px-2 py-3 text-center w-14">Poin</th>
                          <th className="px-2 py-3 text-center w-[20%]">Akumulasi</th>
                          <th className="px-2 py-3 text-center w-20">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 bg-white">
                        {stats.todayViolationsList.map((v, i) => (
                          <tr key={v.id} className="hover:bg-zinc-100/30 transition">
                            <td className="px-2 py-3 text-center text-zinc-500 font-semibold">{i + 1}</td>
                            <td className="px-3 py-3">
                              <div className="font-bold text-zinc-900 text-xs truncate" title={v.student_name}>{v.student_name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">NIPD: {v.nipd || '-'}</div>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-[11px] bg-zinc-100 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                                {v.class_name || '-'}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-zinc-800 font-medium text-xs leading-snug">
                              {v.category_name}
                            </td>
                            <td className="px-2 py-3 text-center whitespace-nowrap">
                              <span className="inline-block px-2 py-0.5 rounded font-bold text-[11px] bg-red-50 text-red-700 border border-red-200">
                                +{v.point_deduction}p
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <PointBadge points={v.student_total_points} stacked={true} />
                            </td>
                            <td className="px-2 py-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => setSelectedStudentForSanction(v.student_id)}
                                className="text-indigo-700 hover:text-zinc-900 bg-zinc-100 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap"
                                title="Lihat Surat Sanksi"
                              >
                                <FileText className="text-sm" />
                                <span>Surat</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-zinc-200 bg-zinc-50 flex justify-between items-center">
              <button
                onClick={() => {
                  setActiveModal(null);
                  navigate('/violations');
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span>Buka Menu Pelanggaran Lengkap</span>
                <ArrowRight className="text-sm" />
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-700 hover:bg-zinc-100 transition text-xs sm:text-sm font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL 3: SEMUA PELANGGARAN ================= */}
      {activeModal === 'allViolations' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-100/80">
              {selectedStudentForDetail ? (
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedStudentForDetail(null)}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm text-xs font-semibold cursor-pointer flex-shrink-0"
                    title="Kembali ke Rekapitulasi Siswa"
                  >
                    <ArrowLeft className="text-base" />
                    <span className="hidden sm:inline">Kembali</span>
                  </button>
                  <div className="truncate">
                    <h3 className="text-sm sm:text-lg font-bold text-zinc-900 truncate">
                      Rincian: {selectedStudentForDetail.student_name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-zinc-500 truncate">
                      Kelas: <strong>{selectedStudentForDetail.class_name}</strong> &bull; Total {selectedStudentForDetail.violations.length} Kasus Pelanggaran
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="p-2 bg-zinc-900 text-white rounded-xl flex-shrink-0">
                    <ClipboardList className="text-lg sm:text-xl" />
                  </div>
                  <div className="truncate">
                    <h3 className="text-sm sm:text-lg font-bold text-zinc-900 truncate">Rekapitulasi Seluruh Pelanggaran Tercatat</h3>
                    <p className="text-[11px] sm:text-xs text-zinc-500 truncate">
                      Total {stats.totalViolations} kasus &bull; Rekap akumulasi poin siswa
                    </p>
                  </div>
                </div>
              )}
              <button 
                onClick={() => {
                  setActiveModal(null);
                  setSelectedStudentForDetail(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 transition p-1.5 rounded-full hover:bg-white flex-shrink-0"
              >
                <X className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            {selectedStudentForDetail ? (
              /* VIEW 2: DETAIL PELANGGARAN SISWA IN-MODAL */
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2.5 bg-zinc-100/70 p-3.5 sm:p-4 rounded-xl border border-purple-100 text-xs sm:text-sm">
                  <div className="min-w-0">
                    <span className="text-zinc-600">Nama Siswa: </span>
                    <strong className="text-zinc-900 font-bold">{selectedStudentForDetail.student_name}</strong>
                    <span className="text-zinc-500 ml-1.5">({selectedStudentForDetail.class_name} &bull; NIPD: {selectedStudentForDetail.nipd || '-'})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 font-medium">Akumulasi Total:</span>
                    <PointBadge points={selectedStudentForDetail.student_total_points} />
                  </div>
                </div>

                {/* Mobile View: Cards */}
                <div className="sm:hidden space-y-2.5">
                  {selectedStudentForDetail.violations.map((v, idx) => (
                    <div key={v.id || idx} className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-zinc-900 text-xs leading-snug">{v.category_name}</span>
                        <span className="inline-block px-2 py-0.5 rounded font-bold text-[11px] bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
                          +{v.point_deduction} Poin
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-1 border-t border-zinc-100">
                        <span>Tanggal: {new Date(v.violation_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {v.note && <span className="italic text-zinc-600 truncate max-w-[150px]">{v.note}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden sm:block overflow-hidden border border-zinc-200 rounded-xl shadow-sm">
                  <table className="w-full text-left border-collapse text-xs table-fixed">
                    <thead className="bg-zinc-50 text-[11px] uppercase font-semibold text-zinc-500 tracking-wider border-b border-zinc-200">
                      <tr>
                        <th className="px-2 py-3 text-center w-10">No</th>
                        <th className="px-3 py-3 w-[45%]">Bentuk Pelanggaran</th>
                        <th className="px-2 py-3 text-center w-20">Poin</th>
                        <th className="px-2 py-3 text-center w-28">Tanggal</th>
                        <th className="px-3 py-3 w-[25%]">Catatan / Kronologi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {selectedStudentForDetail.violations.map((v, idx) => (
                        <tr key={v.id || idx} className="hover:bg-zinc-100/20 transition">
                          <td className="px-2 py-3 text-center text-zinc-500 font-semibold">{idx + 1}</td>
                          <td className="px-3 py-3 font-semibold text-zinc-900 leading-snug">{v.category_name}</td>
                          <td className="px-2 py-3 text-center whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 rounded-md font-bold text-[11px] bg-red-50 text-red-700 border border-red-200">
                              +{v.point_deduction} Poin
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center text-zinc-600 whitespace-nowrap font-medium">
                            {new Date(v.violation_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-3 py-3 text-zinc-600 leading-relaxed text-xs">
                            {v.note || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : loadingAllViolations ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <div className="text-sm font-semibold text-zinc-600">Memuat rincian data seluruh pelanggaran...</div>
                <div className="text-xs text-zinc-400">Harap tunggu sebentar, sedang menarik riwayat lengkap dari server.</div>
              </div>
            ) : (
              /* VIEW 1: TABEL REKAPITULASI GROUPED BY STUDENT */
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                {/* Search input & Class Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="sm:col-span-2 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-base" />
                    <input
                      type="text"
                      placeholder="Cari nama siswa, NIPD, kelas, atau jenis pelanggaran..."
                      value={allViolationsSearch}
                      onChange={(e) => setAllViolationsSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none bg-zinc-50/50 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <select
                      value={allViolationsClassFilter}
                      onChange={(e) => setAllViolationsClassFilter(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none bg-white transition text-zinc-700 font-medium"
                    >
                      <option value="">-- Semua Rombel Kelas --</option>
                      {availableClassesForFilter.map((c) => (
                        <option key={c.id || c.class_name} value={c.class_name}>
                          Kelas {c.class_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category Per Kelas / Angkatan Quick Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1 border-b border-zinc-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-zinc-500 mr-1 flex items-center gap-1">
                      <Filter className="text-xs" /> Kategori:
                    </span>
                    
                    {/* Tab Semua */}
                    <button
                      onClick={() => {
                        setAllViolationsGradeFilter('ALL');
                        setAllViolationsClassFilter('');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                        allViolationsGradeFilter === 'ALL' && !allViolationsClassFilter
                          ? 'bg-zinc-900 text-white shadow-sm'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      <span>Semua Kelas</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        allViolationsGradeFilter === 'ALL' && !allViolationsClassFilter ? 'bg-purple-800/60 text-white' : 'bg-zinc-200 text-zinc-700'
                      }`}>
                        {totalViolatorsCount}
                      </span>
                    </button>

                    {/* Tab Kelas X */}
                    <button
                      onClick={() => {
                        setAllViolationsGradeFilter('X');
                        setAllViolationsClassFilter('');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                        allViolationsGradeFilter === 'X'
                          ? 'bg-zinc-900 text-white shadow-sm'
                          : 'bg-zinc-100 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                      }`}
                    >
                      <span>Kelas X (10)</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        allViolationsGradeFilter === 'X' ? 'bg-indigo-800/60 text-white' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {gradeXCount}
                      </span>
                    </button>

                    {/* Tab Kelas XI */}
                    <button
                      onClick={() => {
                        setAllViolationsGradeFilter('XI');
                        setAllViolationsClassFilter('');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                        allViolationsGradeFilter === 'XI'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      <span>Kelas XI (11)</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        allViolationsGradeFilter === 'XI' ? 'bg-blue-800/60 text-white' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {gradeXICount}
                      </span>
                    </button>

                    {/* Tab Kelas XII */}
                    <button
                      onClick={() => {
                        setAllViolationsGradeFilter('XII');
                        setAllViolationsClassFilter('');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                        allViolationsGradeFilter === 'XII'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-zinc-100 text-amber-700 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      <span>Kelas XII (12)</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        allViolationsGradeFilter === 'XII' ? 'bg-amber-800/60 text-white' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {gradeXIICount}
                      </span>
                    </button>
                  </div>

                  {/* Info Hasil & Reset */}
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>Hasil: <strong>{filteredGroupedStudents.length}</strong> siswa</span>
                    {(allViolationsSearch || allViolationsGradeFilter !== 'ALL' || allViolationsClassFilter) && (
                      <button
                        onClick={() => {
                          setAllViolationsSearch('');
                          setAllViolationsGradeFilter('ALL');
                          setAllViolationsClassFilter('');
                        }}
                        className="text-xs text-purple-700 hover:text-zinc-900 font-semibold underline ml-1 cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                </div>

                {filteredGroupedStudents.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <ShieldCheck className="text-4xl text-emerald-500 mx-auto" />
                    <div className="font-bold text-zinc-800 text-sm">Tidak ada siswa sesuai filter</div>
                    <p className="text-xs text-zinc-400">Tidak ada riwayat pelanggaran untuk kriteria pencarian ini.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile View: Cards */}
                    <div className="md:hidden space-y-3">
                      {filteredGroupedStudents.map((s, i) => {
                        const latestViolation = s.violations[0];
                        return (
                          <div key={s.student_id} className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm space-y-2.5">
                            {/* Header: Nama Siswa & Badge Poin */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-bold text-zinc-900 text-xs sm:text-sm leading-tight truncate">{s.student_name}</div>
                                <div className="text-[11px] text-zinc-500 mt-0.5">
                                  NIPD: {s.nipd || '-'} &bull; Kelas: <span className="font-semibold text-indigo-700">{s.class_name || '-'}</span>
                                </div>
                              </div>
                              <PointBadge points={s.student_total_points} />
                            </div>

                            {/* Info Pelanggaran & Tanggal */}
                            <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-100">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-purple-700 border border-purple-200">
                                {s.violations.length} Kasus Pelanggaran
                              </span>
                              <span className="text-[11px] text-zinc-500">
                                Terakhir: {latestViolation ? new Date(latestViolation.violation_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                              </span>
                            </div>

                            {/* Tombol Aksi 2 Kolom Penuh */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                onClick={() => setSelectedStudentForDetail(s)}
                                className="w-full py-2 bg-zinc-100 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                              >
                                <Eye className="text-sm" />
                                <span>Rincian ({s.violations.length})</span>
                              </button>
                              <button
                                onClick={() => setSelectedStudentForSanction(s.student_id)}
                                className="w-full py-2 bg-zinc-100 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                              >
                                <FileText className="text-sm" />
                                <span>Surat Sanksi</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop View: Table (Tampil di Layar Lebar tanpa Scroll Samping) */}
                    <div className="hidden md:block overflow-hidden border border-zinc-200 rounded-xl shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs table-fixed min-w-[900px]">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase font-semibold text-zinc-500 tracking-wider tracking-wider">
                            <tr>
                              <th className="px-2 py-3 text-center w-10">No</th>
                              <th className="px-3 py-3 w-[25%]">Nama Siswa</th>
                              <th className="px-2 py-3 text-center w-16">Kelas</th>
                              <th className="px-2 py-3 text-center w-[15%]">Total Kasus</th>
                              <th className="px-2 py-3 text-center w-[15%]">Akumulasi Poin</th>
                              <th className="px-2 py-3 text-center w-[15%]">Tanggal</th>
                              <th className="px-2 py-3 text-center w-[180px]">Aksi</th>
                            </tr>
                          </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white">
                          {filteredGroupedStudents.map((s, i) => {
                            const latestViolation = s.violations[0];
                            return (
                              <tr key={s.student_id} className="hover:bg-zinc-100/30 transition">
                                <td className="px-2 py-3 text-center text-zinc-500 font-semibold">{i + 1}</td>
                                <td className="px-3 py-3">
                                  <div className="font-bold text-zinc-900 text-xs truncate" title={s.student_name}>{s.student_name}</div>
                                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">NIPD: {s.nipd || '-'}</div>
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-[11px] bg-zinc-100 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                                    {s.class_name || '-'}
                                  </span>
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-purple-700 border border-purple-200 whitespace-nowrap">
                                    {s.violations.length} Kasus
                                  </span>
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <PointBadge points={s.student_total_points} />
                                </td>
                                <td className="px-2 py-3 text-center text-zinc-600 font-medium text-[11px] whitespace-nowrap">
                                  {latestViolation ? new Date(latestViolation.violation_date).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short'
                                  }) : '-'}
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setSelectedStudentForDetail(s)}
                                      className="text-purple-700 hover:text-zinc-900 bg-zinc-100 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded-md text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                      title="Lihat Daftar Bentuk Pelanggaran Siswa"
                                    >
                                      <Eye className="text-xs" />
                                      <span>Rincian ({s.violations.length})</span>
                                    </button>
                                    <button
                                      onClick={() => setSelectedStudentForSanction(s.student_id)}
                                      className="text-indigo-700 hover:text-zinc-900 bg-zinc-100 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-md text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                      title="Lihat Surat Sanksi Siswa"
                                    >
                                      <FileText className="text-xs" />
                                      <span>Surat</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-zinc-200 bg-zinc-50 flex flex-wrap justify-between items-center gap-2">
              {selectedStudentForDetail ? (
                <div className="flex flex-wrap items-center gap-2 w-full justify-between">
                  <button
                    onClick={() => setSelectedStudentForDetail(null)}
                    className="px-3.5 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <ArrowLeft className="text-sm" />
                    <span>Kembali</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const sid = selectedStudentForDetail.student_id;
                        setSelectedStudentForDetail(null);
                        setSelectedStudentForSanction(sid);
                      }}
                      className="px-3.5 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <FileText className="text-base" />
                      <span>Surat Sanksi</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveModal(null);
                        setSelectedStudentForDetail(null);
                      }}
                      className="px-4 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-700 hover:bg-zinc-100 transition text-xs sm:text-sm font-medium cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveModal(null);
                        navigate('/violations');
                      }}
                      className="px-3.5 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Buka Menu Pelanggaran</span>
                      <ArrowRight className="text-sm" />
                    </button>
                    <button
                      onClick={handleExportViolations}
                      className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                      title="Export Seluruh Pelanggaran ke Excel"
                    >
                      <FileDown className="text-base" />
                      <span>Excel</span>
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      setSelectedStudentForDetail(null);
                    }}
                    className="px-4 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-700 hover:bg-zinc-100 transition text-xs sm:text-sm font-medium cursor-pointer"
                  >
                    Tutup
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL 4: PERLU PENANGANAN (>= 21 POIN) ================= */}
      {activeModal === 'attention' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-zinc-200 flex justify-between items-center bg-rose-50/80">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-2 bg-rose-600 text-white rounded-xl flex-shrink-0">
                  <AlertTriangle className="text-lg sm:text-xl" />
                </div>
                <div className="truncate">
                  <h3 className="text-sm sm:text-lg font-bold text-zinc-900 truncate">Siswa Perlu Penanganan Khusus</h3>
                  <p className="text-[11px] sm:text-xs text-zinc-500 truncate">Siswa dengan akumulasi &ge; 21 Poin</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-zinc-400 hover:text-zinc-600 transition p-1.5 rounded-full hover:bg-white flex-shrink-0"
              >
                <X className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {stats.studentsNeedAttentionList.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <ShieldCheck className="text-4xl text-emerald-500 mx-auto" />
                  <div className="font-bold text-zinc-800 text-sm">Tidak ada siswa yang mencapai &ge;21 Poin</div>
                  <p className="text-xs text-zinc-400">Seluruh siswa berada dalam batas aman tata tertib sekolah.</p>
                </div>
              ) : (
                <>
                  {/* Mobile View: Cards */}
                  <div className="sm:hidden space-y-3">
                    {stats.studentsNeedAttentionList.map((s, i) => (
                      <div key={s.id} className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-zinc-900 text-xs sm:text-sm leading-tight truncate">{s.student_name}</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              NIPD: {s.nipd || '-'} &bull; Kelas: <span className="font-semibold text-indigo-700">{s.class_name || '-'}</span>
                            </div>
                          </div>
                          <PointBadge points={s.total_points} />
                        </div>
                        <div className="pt-1">
                          <button
                            onClick={() => setSelectedStudentForSanction(s.id)}
                            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                          >
                            <FileText className="text-sm" />
                            <span>Lihat & Cetak Surat Sanksi</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="hidden sm:block overflow-hidden border border-zinc-200 rounded-xl shadow-sm">
                    <table className="w-full text-left border-collapse text-xs table-fixed">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase font-semibold text-zinc-500 tracking-wider">
                        <tr>
                          <th className="px-2 py-3 text-center w-10">No</th>
                          <th className="px-3 py-3 w-[35%]">Nama Siswa</th>
                          <th className="px-2 py-3 text-center w-16">Kelas</th>
                          <th className="px-2 py-3 text-center w-[25%]">Status Akumulasi Poin</th>
                          <th className="px-2 py-3 text-center w-[25%]">Aksi Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 bg-white">
                        {stats.studentsNeedAttentionList.map((s, i) => (
                          <tr key={s.id} className="hover:bg-rose-50/30 transition">
                            <td className="px-2 py-3 text-center text-zinc-500 font-semibold">{i + 1}</td>
                            <td className="px-3 py-3">
                              <div className="font-bold text-zinc-900 text-xs truncate">{s.student_name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">NIPD: {s.nipd || '-'}</div>
                            </td>
                            <td className="px-2 py-3 text-center whitespace-nowrap">
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-[11px] bg-zinc-100 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                                {s.class_name || '-'}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center whitespace-nowrap">
                              <PointBadge points={s.total_points} />
                            </td>
                            <td className="px-2 py-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => setSelectedStudentForSanction(s.id)}
                                className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-[11px] transition inline-flex items-center gap-1 shadow-sm cursor-pointer"
                                title="Lihat & Cetak Surat Sanksi"
                              >
                                <FileText className="text-xs" /> Surat Sanksi
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-zinc-200 bg-zinc-50 flex justify-between items-center">
              <button
                onClick={() => {
                  setActiveModal(null);
                  navigate('/violations');
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span>Buka Menu Pelanggaran Lengkap</span>
                <ArrowRight className="text-sm" />
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-700 hover:bg-zinc-100 transition text-xs sm:text-sm font-medium"
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

