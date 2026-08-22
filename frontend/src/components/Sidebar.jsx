import { NavLink } from 'react-router-dom';
import { Home, AlertCircle, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-indigo-900 text-white flex flex-col h-full shadow-2xl md:shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header Logo & School Name */}
        <div className="py-3.5 px-3.5 border-b border-indigo-800 flex items-center justify-between bg-indigo-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="bg-white p-0.5 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="Logo SMA Negeri 2 Salatiga" 
                className="w-8 h-10 object-contain"
              />
            </div>
            <div className="leading-tight">
              <h2 className="text-xs font-black tracking-wide text-white uppercase font-sans">
                SMA NEGERI 2 SALATIGA
              </h2>
              <p className="text-[10px] text-indigo-300 font-medium tracking-wider mt-0.5">
                Sistem Informasi BK
              </p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button 
            onClick={onClose}
            className="md:hidden text-indigo-300 hover:text-white p-1 rounded-lg hover:bg-indigo-800 transition"
            aria-label="Tutup Menu"
          >
            <X className="text-2xl" />
          </button>
        </div>
        
        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <NavLink
            to="/"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-indigo-800 text-white font-semibold shadow-md shadow-indigo-950/30' 
                  : 'text-indigo-200 hover:bg-indigo-800/60 hover:text-white'
              }`
            }
          >
            <Home className="text-xl flex-shrink-0" />
            <span className="text-sm">Dashboard</span>
          </NavLink>

          <NavLink
            to="/violations"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-indigo-800 text-white font-semibold shadow-md shadow-indigo-950/30' 
                  : 'text-indigo-200 hover:bg-indigo-800/60 hover:text-white'
              }`
            }
          >
            <AlertCircle className="text-xl flex-shrink-0" />
            <span className="text-sm">Input & Riwayat Pelanggaran</span>
          </NavLink>
          
          <NavLink
            to="/students"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-indigo-800 text-white font-semibold shadow-md shadow-indigo-950/30' 
                  : 'text-indigo-200 hover:bg-indigo-800/60 hover:text-white'
              }`
            }
          >
            <Users className="text-xl flex-shrink-0" />
            <span className="text-sm">Data Siswa</span>
          </NavLink>

          {/* Menu Khusus Super Admin: Manajemen Akun Guru */}
          {isAdmin && (
            <NavLink
              to="/users"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-indigo-800 text-white font-semibold shadow-md shadow-indigo-950/30 ring-1 ring-indigo-400/40' 
                    : 'text-indigo-200 hover:bg-indigo-800/60 hover:text-white'
                }`
              }
            >
              <Users className="text-xl flex-shrink-0 text-amber-300" />
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm">Akun Guru & Petugas</span>
                <span className="text-[9px] bg-amber-400 text-indigo-950 px-1.5 py-0.5 rounded font-black uppercase">
                  Admin
                </span>
              </div>
            </NavLink>
          )}
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-indigo-800/80 text-center text-xs text-indigo-300 flex items-center justify-center space-x-2 bg-indigo-950/40">
          <div className="bg-white p-0.5 rounded flex items-center justify-center">
            <img src="/logo.png" alt="SMAN 2 Salatiga" className="w-3.5 h-4.5 object-contain" />
          </div>
          <span className="text-[11px] font-medium tracking-wide">&copy; 2026 SMAN 2 SALATIGA</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
