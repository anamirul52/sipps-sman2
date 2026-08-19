import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login berhasil! Selamat datang.');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-indigo-100 animate-in fade-in">
        {/* Header Logo & Title */}
        <div className="text-center mb-6">
          <div className="inline-block bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mx-auto mb-2.5">
            <img 
              src="/logo.png" 
              alt="Logo SMA Negeri 2 Salatiga" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-wide">
            SMA NEGERI 2 SALATIGA
          </h1>
          <p className="text-xs font-semibold text-indigo-600 mt-1 uppercase tracking-wider">
            Sistem Informasi Pencatatan Pelanggaran Siswa
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Email Pengguna
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <HiOutlineMail className="text-gray-400 text-lg" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="email@school.id"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <HiOutlineLockClosed className="text-gray-400 text-lg" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 text-sm mt-2"
          >
            {loading ? 'Memverifikasi Akun...' : 'Masuk ke Sistem'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-gray-600">
          <p className="font-bold text-indigo-950 mb-2">Pilih Cepat Akun Demo (Klik untuk Isi):</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setEmail('superadmin@school.id'); setPassword('superadmin123'); }}
              className="text-left p-2.5 bg-white rounded-xl border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400 transition shadow-sm"
            >
              <div className="font-bold text-indigo-700 text-xs">👑 Super Admin</div>
              <div className="text-[10px] text-gray-500 font-mono">superadmin</div>
            </button>

            <button
              type="button"
              onClick={() => { setEmail('bk@school.id'); setPassword('bk123'); }}
              className="text-left p-2.5 bg-white rounded-xl border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400 transition shadow-sm"
            >
              <div className="font-bold text-indigo-700 text-xs">🧑‍🏫 Guru BK</div>
              <div className="text-[10px] text-gray-500 font-mono">bk@school.id</div>
            </button>

            <button
              type="button"
              onClick={() => { setEmail('piket@school.id'); setPassword('piket123'); }}
              className="text-left p-2.5 bg-white rounded-xl border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400 transition shadow-sm"
            >
              <div className="font-bold text-indigo-700 text-xs">📋 Guru Piket</div>
              <div className="text-[10px] text-gray-500 font-mono">piket@school.id</div>
            </button>

            <button
              type="button"
              onClick={() => { setEmail('walikelas@school.id'); setPassword('walikelas123'); }}
              className="text-left p-2.5 bg-white rounded-xl border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400 transition shadow-sm"
            >
              <div className="font-bold text-indigo-700 text-xs">👨‍🏫 Wali Kelas</div>
              <div className="text-[10px] text-gray-500 font-mono">walikelas@school.id</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
