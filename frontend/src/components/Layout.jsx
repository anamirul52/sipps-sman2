import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { HiOutlineLogout, HiMenuAlt2 } from 'react-icons/hi';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Helper untuk membersihkan gelar depan dan gelar belakang dari nama
  const getCleanName = (fullName) => {
    if (!fullName) return '';
    // 1. Ambil bagian sebelum koma (gelar belakang umumnya setelah koma: misal "Khoirul Anam, S.Pd.")
    let clean = fullName.split(',')[0].trim();

    // 2. Hapus gelar depan (Drs., Dra., Dr., Prof., Ir., H., Hj., dll.)
    const frontTitlesRegex = /^(drs|dra|dr|prof|ir|h|hj|kh|k\.h|ust|ustadz|gus|rm|pdt|ns|drg|apt)\.?\s+/i;
    while (frontTitlesRegex.test(clean)) {
      clean = clean.replace(frontTitlesRegex, '').trim();
    }

    // 3. Hapus gelar belakang jika ditulis tanpa koma (misal "Khoirul Anam S.Pd")
    const backTitlesRegex = /\s+(s\.pd|s\.pd\.i|s\.kom|s\.t|s\.si|s\.ag|s\.sos|s\.e|s\.h|s\.psi|s\.ked|s\.farm|s\.ip|s\.sn|s\.hum|m\.pd|m\.pd\.i|m\.kom|m\.t|m\.si|m\.ag|m\.sos|m\.e|m\.m|m\.h|m\.psi|m\.farm|m\.ip|m\.sn|gr|kons|akt|b\.a|b\.sc|m\.sc|ph\.d)\.?$/i;
    while (backTitlesRegex.test(clean)) {
      clean = clean.replace(backTitlesRegex, '').trim();
    }

    clean = clean.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').trim();
    return clean || fullName;
  };

  // Helper untuk mendapatkan singkatan nama murni (misal: "Khoirul Anam, S.Pd." -> "KA")
  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const cleanName = getCleanName(fullName);
    const words = cleanName.trim().split(/\s+/).filter(w => w.length > 0 && /^[a-zA-Z]/.test(w));
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const userInitials = getInitials(user?.name);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Responsive Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header bar */}
        <header className="bg-white h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 z-10 border-b border-gray-200">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none transition flex-shrink-0"
              aria-label="Buka Menu"
            >
              <HiMenuAlt2 className="text-2xl" />
            </button>

            {/* School Identity (Sama di Mobile & Desktop: SMA NEGERI 2 SALATIGA) */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="bg-white p-0.5 rounded-md border border-gray-200 shadow-sm flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="SMA Negeri 2 Salatiga" className="w-5 h-6 sm:w-6 sm:h-7 object-contain" />
              </div>
              <div className="leading-tight min-w-0">
                <span className="font-semibold text-slate-900 tracking-wide text-xs sm:text-sm uppercase block truncate">
                  SMA NEGERI 2 SALATIGA
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium block leading-none mt-0.5 truncate">
                  Sistem Informasi BK
                </span>
              </div>
            </div>
          </div>
          
          {/* User Profile & Logout */}
          <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
            {/* User Name & Role: Tampil di Desktop saja (Disembunyikan di Mobile) */}
            <div className="text-right leading-tight hidden sm:block">
              <div className="font-semibold text-sm text-slate-900 truncate max-w-[180px]">
                {user?.name || 'User'}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {user?.role || 'Admin'}
              </div>
            </div>
            
            {/* User Avatar Circle with Initials (Tampil di Mobile & Desktop) */}
            <div 
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center border border-gray-200 flex-shrink-0"
              title={`${user?.name || 'User'} (${user?.role || 'Admin'})`}
            >
              {userInitials}
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition border border-transparent flex-shrink-0"
              title="Keluar / Logout"
            >
              <HiOutlineLogout className="text-lg sm:text-xl" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
