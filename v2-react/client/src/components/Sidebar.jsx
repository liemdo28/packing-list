import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BellIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon,
  ReceiptPercentIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';

const allNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin', 'b1', 'b2', 'b3', 'accountant'] },
  { name: 'Orders', href: '/orders', icon: ClipboardDocumentListIcon, roles: ['admin', 'b1', 'b2', 'b3', 'accountant'] },
  { name: 'Items', href: '/items', icon: CubeIcon, roles: ['admin', 'b1', 'b2', 'b3', 'accountant'] },
  { name: 'Prices', href: '/prices', icon: CurrencyDollarIcon, roles: ['admin', 'accountant'] },
  { name: 'Stores', href: '/stores', icon: BuildingStorefrontIcon, roles: ['admin'] },
  { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon, roles: ['admin', 'accountant', 'b2'] },
  { name: 'Summary', href: '/summary', icon: ChartBarIcon, roles: ['admin', 'accountant'] },
  { name: 'Notifications', href: '/notifications', icon: BellIcon, roles: ['admin', 'b1', 'b2', 'b3', 'accountant'] },
  { name: 'Users', href: '/users', icon: UsersIcon, roles: ['admin'] },
  { name: 'Audit Logs', href: '/audit-logs', icon: ClipboardDocumentCheckIcon, roles: ['admin', 'accountant'] },
  { name: 'Packing', href: '/packing', icon: ArchiveBoxIcon, roles: ['admin', 'b1', 'b2', 'b3'] },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  const navItems = allNavItems.filter(item => item.roles.includes(user?.role));

  const linkClasses = ({ isActive }) =>
    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
      isActive
        ? 'bg-primary-50 text-primary-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <ReceiptPercentIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">Restaurant Operation System</span>
        </div>
        <button onClick={onClose} className="lg:hidden rounded-lg p-1 text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} to={item.href} className={linkClasses} onClick={onClose}>
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-400">Restaurant Operation System v2.0</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-gray-600/75 lg:hidden" onClick={onClose} />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto border-r border-gray-200 bg-white">
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
