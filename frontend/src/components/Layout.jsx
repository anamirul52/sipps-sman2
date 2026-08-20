import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { HiOutlineLogout, HiMenuAlt2 } from 'react-icons/hi';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Responsive Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header bar */}
        <header className="bg-white shadow-2xs h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 z-10 border-b border-gray-200">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 sm:p-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none transition flex-shrink-0"
              aria-label="Buka Menu"
            >
              <HiMenuAlt2 className="text-2xl" />
            </button>

            {/* School Identity */}
            <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
              <div className="bg-white p-0.5 rounded-md border border-gray-200 shadow-2xs flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="SMA Negeri 2 Salatiga" className="w-5 h-6 object-contain" />
              </div>
              <div className="truncate">
                <span className="font-extrabold text-indigo-900 tracking-wide text-xs sm:text-sm uppercase block truncate">
                  SMA NEGERI 2 SALATIGA
                </span>
                <span className="text-[10px] text-gray-400 font-medium sm:hidden block leading-none">
                  Sistem Informasi BK
                </span>
                <span className="text-xs text-gray-500 font-medium hidden lg:inline">
                  &bull; Sistem Informasi BK
                </span>
              </div>
            </div>
          </div>
          
          {/* User Profile & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <div className="text-right">
              <div className="font-bold text-xs sm:text-sm text-gray-900 truncate max-w-[90px] sm:max-w-[180px]">
                {user?.name || 'User'}
              </div>
              <div className="text-[9px] sm:text-xs text-indigo-600 font-semibold uppercase leading-none">
                {user?.role || 'Admin'}
              </div>
            </div>
            
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
