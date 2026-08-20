import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { HiOutlineLogout, HiMenuAlt2 } from 'react-icons/hi';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Helper untuk mendapatkan singkatan nama (misal: Khoirul Anam -> KA)
  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const userInitials = getInitials(user?.name);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Responsive Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header bar */}
        <header className="bg-white shadow-2xs h-14 sm:h-16 flex items-center justify-between px-2.5 sm:px-6 z-10 border-b border-gray-200">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none transition flex-shrink-0"
              aria-label="Buka Menu"
            >
              <HiMenuAlt2 className="text-2xl" />
            </button>

            {/* School Identity (Sama di Mobile & Desktop: SMA NEGERI 2 SALATIGA) */}
            <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
              <div className="bg-white p-0.5 rounded-md border border-gray-200 shadow-2xs flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="SMA Negeri 2 Salatiga" className="w-5 h-6 sm:w-6 sm:h-7 object-contain" />
              </div>
              <div className="leading-tight min-w-0">
                <span className="font-extrabold text-indigo-950 tracking-wide text-xs sm:text-sm uppercase block truncate">
                  SMA NEGERI 2 SALATIGA
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium block leading-none mt-0.5 truncate">
                  Sistem Informasi BK
                </span>
              </div>
            </div>
          </div>
          
          {/* User Profile & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3.5 flex-shrink-0">
            {/* User Name & Role: Tampil di Desktop saja (Disembunyikan di Mobile) */}
            <div className="text-right leading-tight hidden sm:block">
              <div className="font-bold text-sm text-gray-900 truncate max-w-[180px]">
                {user?.name || 'User'}
              </div>
              <div className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
                {user?.role || 'Admin'}
              </div>
            </div>
            
            {/* User Avatar Circle with Initials (Tampil di Mobile & Desktop) */}
            <div 
              className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center border border-indigo-200 shadow-2xs flex-shrink-0"
              title={`${user?.name || 'User'} (${user?.role || 'Admin'})`}
            >
              {userInitials}
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition border border-transparent hover:border-red-100 flex-shrink-0"
              title="Keluar / Logout"
            >
              <HiOutlineLogout className="text-lg sm:text-xl" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/70 p-3 sm:p-5 md:p-6">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
