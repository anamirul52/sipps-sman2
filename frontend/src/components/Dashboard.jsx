import { useState, useEffect } from 'react';
import api from '../api/axios';
import PointBadge from './PointBadge';
import { 
  HiUsers, 
  HiExclamationCircle, 
  HiExclamation,
  HiShieldCheck,
  HiClipboardList
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayViolations: 0,
    studentsNeedAttention: 0,
  });
  const [recentViolations, setRecentViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        const { data } = response.data;
        setStats({
          totalStudents: data.totalStudents,
          todayViolations: data.todayViolations,
          studentsNeedAttention: data.studentsNeedAttention,
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
      sanction: 'Peringatan Tertulis III & Surat Pernyataan Bermeterai',
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
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
      
      {/* Stat Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl shadow-md p-5 sm:p-6 flex items-center justify-between text-white transition hover:shadow-lg">
          <div>
            <p className="text-indigo-100 font-medium text-xs sm:text-sm">Total Siswa Terdaftar</p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-1">{stats.totalStudents}</p>
          </div>
          <div className="bg-white/10 p-3 sm:p-3.5 rounded-xl border border-white/20">
            <HiUsers className="text-2xl sm:text-3xl text-white" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-md p-5 sm:p-6 flex items-center justify-between text-white transition hover:shadow-lg">
          <div>
            <p className="text-amber-100 font-medium text-xs sm:text-sm">Pelanggaran Hari Ini</p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-1">{stats.todayViolations}</p>
          </div>
          <div className="bg-white/10 p-3 sm:p-3.5 rounded-xl border border-white/20">
            <HiExclamationCircle className="text-2xl sm:text-3xl text-white" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-2xl shadow-md p-5 sm:p-6 flex items-center justify-between text-white transition hover:shadow-lg sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-rose-100 font-medium text-xs sm:text-sm">Perlu Penanganan (≥21 Poin)</p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-1">{stats.studentsNeedAttention}</p>
          </div>
          <div className="bg-white/10 p-3 sm:p-3.5 rounded-xl border border-white/20">
            <HiExclamation className="text-2xl sm:text-3xl text-white" />
          </div>
        </div>
      </div>

      {/* Tabel Pelanggaran Terbaru */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/70">
          <h2 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
            <HiClipboardList className="text-indigo-600 text-lg sm:text-xl" />
            Pelanggaran Terbaru Masuk
          </h2>
          <span className="text-[11px] text-gray-500 font-semibold bg-gray-200/70 px-2 py-0.5 rounded-full">
            10 Catatan Terkini
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Nama Siswa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Kelas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori Pelanggaran</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Poin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Akumulasi Poin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentViolations.map((v, index) => (
                <tr key={v.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3.5 text-xs sm:text-sm text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-semibold text-gray-900">{v.student_name}</div>
                  </td>
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 min-w-[65px] whitespace-nowrap">
                      {v.class_name || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs sm:text-sm text-gray-700 font-medium min-w-[200px]">
                    {v.category_name}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                      +{v.point_deduction} Poin
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <PointBadge points={v.student_total_points} />
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
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
                  <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                    Belum ada data pelanggaran hari ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pedoman Sanksi Berdasarkan Total Poin */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
            <HiShieldCheck className="text-indigo-600 text-xl" />
            Pedoman Daftar Sanksi Berdasarkan Total Poin
          </h2>
          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 w-fit">
            7 Jenjang Tindakan Resmi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap w-36">Rentang Poin</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Tindakan / Sanksi</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">Petugas Penanggung Jawab</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">Keterangan</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sanctionTiers.map((tier, idx) => (
                <tr key={idx} className="hover:bg-gray-50/80 transition">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-md border ${tier.color} inline-block font-semibold text-[11px]`}>
                      {tier.range}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900 text-xs sm:text-sm">
                    {tier.sanction}
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {tier.officer}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {tier.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
