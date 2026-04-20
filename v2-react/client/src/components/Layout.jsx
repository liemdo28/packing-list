import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bars3Icon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { FlashMessages } from '../contexts/FlashContext';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS } from '../utils/constants';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <FlashMessages />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 sm:px-6 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 items-center justify-end gap-3">
            <NotificationBell />

            <div className="hidden sm:flex items-center gap-2 text-sm">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500">
                  {ROLE_LABELS[user?.role] || user?.role}
                  {user?.store && ` - ${user.store.code}`}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
