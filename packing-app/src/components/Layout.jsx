import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  PlusCircleIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  DocumentDuplicateIcon as DocDupSolid,
} from '@heroicons/react/24/solid';

const NAV_ITEMS = [
  { to: '/',          label: 'Trips',     Icon: HomeIcon,              ActiveIcon: HomeIconSolid },
  { to: '/templates', label: 'Templates', Icon: DocumentDuplicateIcon, ActiveIcon: DocDupSolid  },
];

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🧳</span>
            <span className="font-bold text-gray-900 tracking-tight">PackRight</span>
          </Link>
          <Link
            to="/trips/new"
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <PlusCircleIcon className="w-4 h-4" />
            New Trip
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30 safe-bottom">
        <div className="max-w-2xl mx-auto flex">
          {NAV_ITEMS.map(({ to, label, Icon, ActiveIcon }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
            const Ico = active ? ActiveIcon : Icon;
            return (
              <Link
                key={to}
                to={to}
                className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors
                  ${active ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Ico className="w-6 h-6" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
