import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { UserPlus, Search, Users, Edit, Trash2, X, HiShieldCheck, Key, Mail, GraduationCap, CheckCircle, AlertTriangle } from 'lucide-react';

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  // Form State Tambah
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'bk',
    class_id: ''
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Form State Edit
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'bk',
    class_id: ''
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete State
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `/users?search=${encodeURIComponent(search)}`;
      if (roleFilter !== 'ALL') {
        url += `&role=${roleFilter}`;
      }
      const res = await api.get(url);
      setUsers(res.data.data || []);
    } catch (err) {
      toast.error('Gagal memuat data pengguna');
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
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, roleFilter]);

  // Handle Tambah Akun
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password || !addForm.role) {
      toast.error('Mohon lengkapi seluruh field wajib');
      return;
    }

    if (addForm.role === 'wali_kelas' && !addForm.class_id) {
      toast.error('Pilih kelas binaan untuk akun Wali Kelas');
      return;
    }

    setSubmittingAdd(true);
    try {
      const res = await api.post('/users', addForm);
      toast.success(res.data.message || 'Akun guru berhasil dibuat!');
      setShowAddModal(false);
      setAddForm({
        name: '',
        email: '',
        password: '',
        role: 'bk',
        class_id: ''
      });
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menambahkan akun';
      toast.error(msg);
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (user) => {
    setUserToEdit(user);
    setEditForm({
      name: user.name,
      email: user.email,
      password: '', // Kosongkan kata sandi jika tidak ingin diubah
      role: user.role,
      class_id: user.assigned_class_id || ''
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.email || !editForm.role) {
      toast.error('Nama, email, dan role wajib diisi');
      return;
    }

    if (editForm.role === 'wali_kelas' && !editForm.class_id) {
      toast.error('Pilih kelas binaan untuk akun Wali Kelas');
      return;
    }

    setSubmittingEdit(true);
    try {
      const res = await api.put(`/users/${userToEdit.id}`, editForm);
      toast.success(res.data.message || 'Data akun berhasil diperbarui!');
      setUserToEdit(null);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal memperbarui akun';
      toast.error(msg);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/users/${userToDelete.id}`);
      toast.success(res.data.message || 'Akun berhasil dihapus');
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menghapus akun';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Stats calculation
  const totalCount = users.length;
  const bkCount = users.filter(u => u.role === 'bk').length;
  const piketCount = users.filter(u => u.role === 'piket').length;
  const waliCount = users.filter(u => u.role === 'wali_kelas').length;

  const renderRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            👑 Super Admin
          </span>
        );
      case 'bk':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            🧑‍🏫 Guru BK
          </span>
        );
      case 'piket':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            📋 Guru Piket
          </span>
        );
      case 'wali_kelas':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            👨‍🏫 Wali Kelas
          </span>
        );
      default:
        return <span className="text-xs text-gray-500 capitalize">{role}</span>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Title & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-indigo-600 text-2xl sm:text-3xl" />
              Manajemen Akun Guru & Petugas
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Kelola hak akses akun Guru BK, Guru Piket, Wali Kelas, dan Super Admin
            </p>
          </div>

          <button
            onClick={() => {
              setAddForm({
                name: '',
                email: '',
                password: '',
                role: 'bk',
                class_id: ''
              });
              setShowAddModal(true);
            }}
            className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition text-sm w-full sm:w-auto"
          >
            <UserPlus className="text-lg" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500">Total Akun</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">{totalCount}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Seluruh Pengguna</div>
          </div>

          <div className="bg-indigo-50/60 rounded-2xl border border-indigo-100 p-4">
            <div className="text-xs font-semibold text-indigo-700">Guru BK</div>
            <div className="text-2xl font-extrabold text-indigo-900 mt-1">{bkCount}</div>
            <div className="text-[10px] text-indigo-600 mt-0.5">Penanganan Sanksi</div>
          </div>

          <div className="bg-amber-50/60 rounded-2xl border border-amber-100 p-4">
            <div className="text-xs font-semibold text-amber-700">Guru Piket</div>
            <div className="text-2xl font-extrabold text-amber-900 mt-1">{piketCount}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">Pencatatan Harian</div>
          </div>

          <div className="bg-emerald-50/60 rounded-2xl border border-emerald-100 p-4">
            <div className="text-xs font-semibold text-emerald-700">Wali Kelas</div>
            <div className="text-2xl font-extrabold text-emerald-900 mt-1">{waliCount}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Pembina Kelas</div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 space-y-4">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-100 flex-nowrap sm:flex-wrap">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1 whitespace-nowrap hidden sm:inline">Filter Role:</span>
            {[
              { id: 'ALL', label: 'Semua Akun' },
              { id: 'admin', label: '👑 Super Admin' },
              { id: 'bk', label: '🧑‍🏫 Guru BK' },
              { id: 'piket', label: '📋 Guru Piket' },
              { id: 'wali_kelas', label: '👨‍🏫 Wali Kelas' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition ${
                  roleFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama lengkap atau nama pengguna / username..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Table of Users */}
        {/* Table / Cards of Users */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Mobile View: Cards (Tampil di Layar HP) */}
          <div className="md:hidden p-3 space-y-3">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="text-xs">Memuat data pengguna...</span>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-xs">Tidak ada akun guru yang sesuai filter pencarian.</p>
              </div>
            ) : (
              users.map((u, index) => {
                const isSelf = currentUser && currentUser.id === u.id;
                return (
                  <div key={u.id} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          {u.name}
                          {isSelf && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">
                              Anda
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          Login: {u.email}
                        </div>
                      </div>
                      {renderRoleBadge(u.role)}
                    </div>

                    {u.role === 'wali_kelas' && (
                      <div className="text-xs text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 flex items-center justify-between">
                        <span className="text-[11px] text-gray-600">Kelas Binaan:</span>
                        <span className="font-bold">Kelas {u.assigned_class_name || 'Belum diatur'}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                      <span className="text-[10px] text-gray-400">
                        Terdaftar: {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1 transition"
                          title="Edit Akun"
                        >
                          <Edit className="text-sm" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setUserToDelete(u)}
                          disabled={isSelf}
                          className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Hapus Akun"
                        >
                          <Trash2 className="text-sm" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop View: Table (Tampil di Tablet / PC) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">No</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[160px]">Nama Lengkap</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">Nama Pengguna / Login</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Jabatan / Role</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Kelas Binaan</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Terdaftar</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="text-sm">Memuat data pengguna...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      <p className="text-sm">Tidak ada akun guru yang sesuai filter pencarian.</p>
                    </td>
                  </tr>
                ) : (
                  users.map((u, index) => {
                    const isSelf = currentUser && currentUser.id === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-indigo-50/40 transition">
                        <td className="px-4 py-3.5 text-xs text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3.5">
                          <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                            {u.name}
                            {isSelf && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">
                                Akun Anda
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-600 font-mono">
                          {u.email}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {renderRoleBadge(u.role)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                          {u.role === 'wali_kelas' ? (
                            u.assigned_class_name ? (
                              <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                                Kelas {u.assigned_class_name}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Belum dipilih</span>
                            )
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(u.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
                              title="Edit Akun & Password"
                            >
                              <Edit className="text-base" />
                            </button>
                            
                            <button
                              onClick={() => setUserToDelete(u)}
                              disabled={isSelf}
                              className="p-1.5 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                              title={isSelf ? "Tidak dapat menghapus akun sendiri" : "Hapus Akun"}
                            >
                              <Trash2 className="text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Tambah Akun Guru */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3.5 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 bg-indigo-50/80 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-indigo-950 flex items-center">
                  <UserPlus className="mr-2 text-indigo-600 text-2xl" />
                  Tambah Akun Guru / Petugas Baru
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-white transition"
                >
                  <X className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nama Lengkap & Gelar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="Contoh: Drs. Bambang Sudarsono, M.Pd"
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                {/* Nama Pengguna / Login */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nama Pengguna / Username (Untuk Login) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                    <input
                      type="text"
                      required
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      placeholder="Contoh: bambang, guru_bk, atau email"
                      className="pl-10 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Kata Sandi */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Kata Sandi (Password) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                    <input
                      type="password"
                      required
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      placeholder="Minimal 6 karakter..."
                      className="pl-10 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Pilihan Role */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Jabatan / Hak Akses Akun <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'bk', title: '🧑‍🏫 Guru BK', desc: 'Kelola sanksi & konseling' },
                      { id: 'piket', title: '📋 Guru Piket', desc: 'Input pelanggaran harian' },
                      { id: 'wali_kelas', title: '👨‍🏫 Wali Kelas', desc: 'Pembina kelas siswa' },
                      { id: 'admin', title: '👑 Super Admin', desc: 'Akses penuh seluruh sistem' }
                    ].map(r => (
                      <div
                        key={r.id}
                        onClick={() => setAddForm({ ...addForm, role: r.id })}
                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                          addForm.role === r.id
                            ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-bold text-xs text-gray-900">{r.title}</div>
                        <div className="text-[10px] text-gray-500 mt-1">{r.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dropdown Kelas Binaan jika Wali Kelas */}
                {addForm.role === 'wali_kelas' && (
                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 animate-in fade-in">
                    <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                      Pilih Kelas yang Dibina <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={addForm.class_id}
                      onChange={(e) => setAddForm({ ...addForm, class_id: e.target.value })}
                      required={addForm.role === 'wali_kelas'}
                      className="w-full rounded-lg border border-emerald-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Pilih Kelas (33 Kelas Tersedia) --</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          Kelas {c.class_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAdd}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-bold shadow-md disabled:opacity-50"
                  >
                    {submittingAdd ? 'Menyimpan...' : 'Simpan Akun Guru'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Akun Guru */}
        {userToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3.5 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 bg-amber-50/80 border-b border-amber-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-amber-950 flex items-center">
                  <Edit className="mr-2 text-amber-600 text-2xl" />
                  Edit Akun Pengguna
                </h3>
                <button
                  onClick={() => setUserToEdit(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-white transition"
                >
                  <X className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nama Lengkap & Gelar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nama Pengguna / Username (Untuk Login) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Contoh: bambang, guru_bk, atau email"
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Ganti Kata Sandi (Opsional)
                  </label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Jabatan / Hak Akses Akun <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'bk', title: '🧑‍🏫 Guru BK' },
                      { id: 'piket', title: '📋 Guru Piket' },
                      { id: 'wali_kelas', title: '👨‍🏫 Wali Kelas' },
                      { id: 'admin', title: '👑 Super Admin' }
                    ].map(r => (
                      <div
                        key={r.id}
                        onClick={() => setEditForm({ ...editForm, role: r.id })}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          editForm.role === r.id
                            ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/20 font-bold text-amber-950'
                            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-800'
                        }`}
                      >
                        <div className="text-xs">{r.title}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {editForm.role === 'wali_kelas' && (
                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 animate-in fade-in">
                    <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                      Pilih Kelas Binaan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editForm.class_id}
                      onChange={(e) => setEditForm({ ...editForm, class_id: e.target.value })}
                      required={editForm.role === 'wali_kelas'}
                      className="w-full rounded-lg border border-emerald-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          Kelas {c.class_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setUserToEdit(null)}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="px-5 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition text-sm font-bold shadow-md disabled:opacity-50"
                  >
                    {submittingEdit ? 'Menyimpan...' : 'Perbarui Akun'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus Akun */}
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3.5 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 bg-red-50/80 border-b border-red-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-red-950 flex items-center">
                  <AlertTriangle className="mr-2 text-red-600 text-2xl" />
                  Hapus Akun Pengguna
                </h3>
                <button
                  onClick={() => setUserToDelete(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-white transition"
                >
                  <X className="text-xl" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Apakah Anda yakin ingin menghapus akun guru/petugas ini? Akun tidak akan dapat login lagi ke sistem setelah dihapus.
                </p>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
                  <div>
                    <span className="text-gray-500 block">Nama Pengguna:</span>
                    <strong className="text-gray-900 text-sm">{userToDelete.name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Email:</span>
                    <span className="font-mono text-gray-700">{userToDelete.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Role:</span>
                    <span className="font-semibold text-indigo-700">{renderRoleBadge(userToDelete.role)}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setUserToDelete(null)}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSubmit}
                    disabled={deleting}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm font-bold shadow-md disabled:opacity-50"
                  >
                    {deleting ? 'Menghapus...' : 'Ya, Hapus Akun'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UsersPage;
