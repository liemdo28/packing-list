import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Transition, TransitionChild } from '@headlessui/react';
import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    ClipboardDocumentListIcon,
    BellIcon,
    ChartBarIcon,
    DocumentTextIcon,
    BuildingStorefrontIcon,
    CubeIcon,
    CurrencyDollarIcon,
    UsersIcon,
    ClipboardDocumentCheckIcon,
    ArrowRightOnRectangleIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    CalculatorIcon,
    BeakerIcon,
    DocumentMagnifyingGlassIcon,
    TruckIcon,
} from '@heroicons/react/24/outline';

const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: HomeIcon, roles: ['admin', 'accountant', 'store'] },
    { href: '/orders', label: 'Orders', icon: ClipboardDocumentListIcon, roles: ['admin', 'accountant', 'store'] },
    { href: '/notifications', label: 'Notifications', icon: BellIcon, roles: ['admin', 'accountant', 'store'] },
    { href: '/summary', label: 'Summary', icon: ChartBarIcon, roles: ['admin', 'accountant'] },
    { href: '/invoices', label: 'Invoices', icon: DocumentTextIcon, roles: ['admin', 'accountant'] },
    { href: '/stores', label: 'Stores', icon: BuildingStorefrontIcon, roles: ['admin'] },
    { href: '/items', label: 'Items', icon: CubeIcon, roles: ['admin'] },
    { href: '/prices', label: 'Prices', icon: CurrencyDollarIcon, roles: ['admin'] },
    { href: '/users', label: 'Users', icon: UsersIcon, roles: ['admin'] },
    { href: '/cost-engine', label: 'Cost Engine', icon: CalculatorIcon, roles: ['admin'] },
    { href: '/raw-materials', label: 'Raw Materials', icon: BeakerIcon, roles: ['admin'] },
    { href: '/invoice-scan', label: 'Invoice Scan', icon: DocumentMagnifyingGlassIcon, roles: ['admin'] },
    { href: '/vendors', label: 'Vendors', icon: TruckIcon, roles: ['admin'] },
    { href: '/audit-logs', label: 'Audit Logs', icon: ClipboardDocumentCheckIcon, roles: ['admin'] },
];

const roleBadgeColors = {
    admin: 'bg-red-500/20 text-red-400 border border-red-500/30',
    accountant: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    store: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
};

export default function Layout({ children }) {
    const { auth, flash } = usePage().props;
    const user = auth?.user;
    const role = user?.role || 'store';
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showFlash, setShowFlash] = useState(false);

    const filteredLinks = navLinks.filter((link) => link.roles.includes(role));

    useEffect(() => {
        if (flash?.success || flash?.error) {
            setShowFlash(true);
            const timer = setTimeout(() => setShowFlash(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const SidebarContent = () => (
        <nav className="flex-1 px-2 py-4 space-y-1">
            {filteredLinks.map((link) => {
                const Icon = link.icon;
                const isActive = currentPath.startsWith(link.href);
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            isActive
                                ? 'bg-red-600/20 text-red-400 border-l-2 border-red-500'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-red-400' : ''}`} />
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="min-h-screen bg-[#0f0f0f]">
            {/* Mobile sidebar overlay */}
            <Transition show={sidebarOpen}>
                <div className="fixed inset-0 z-40 flex md:hidden">
                    <TransitionChild
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                    </TransitionChild>
                    <TransitionChild
                        enter="transition ease-in-out duration-300 transform"
                        enterFrom="-translate-x-full"
                        enterTo="translate-x-0"
                        leave="transition ease-in-out duration-300 transform"
                        leaveFrom="translate-x-0"
                        leaveTo="-translate-x-full"
                    >
                        <div className="relative flex w-64 flex-col bg-[#0a0a1a] border-r border-gray-800">
                            <div className="absolute top-0 right-0 -mr-12 pt-2">
                                <button
                                    type="button"
                                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <XMarkIcon className="h-6 w-6 text-white" />
                                </button>
                            </div>
                            <div className="flex h-16 items-center px-4 border-b border-gray-800">
                                <h1 className="text-xl font-bold text-white">
                                    <span className="text-red-500">Packing</span> List
                                </h1>
                            </div>
                            <SidebarContent />
                        </div>
                    </TransitionChild>
                </div>
            </Transition>

            {/* Desktop sidebar */}
            <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
                <div className="flex min-h-0 flex-1 flex-col bg-[#0a0a1a] border-r border-gray-800">
                    <div className="flex h-16 items-center px-4 border-b border-gray-800">
                        <h1 className="text-xl font-bold text-white">
                            <span className="text-red-500">Packing</span> List
                        </h1>
                    </div>
                    <div className="flex flex-1 flex-col overflow-y-auto">
                        <SidebarContent />
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex flex-col md:pl-64">
                {/* Top navbar */}
                <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-[#1a1a2e] border-b border-gray-800 shadow-lg">
                    <button
                        type="button"
                        className="px-4 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 md:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>
                    <div className="flex flex-1 justify-end px-4">
                        <div className="flex items-center space-x-4">
                            <Link href="/notifications" className="relative text-gray-400 hover:text-white transition-colors">
                                <BellIcon className="h-6 w-6" />
                            </Link>
                            <span className="text-sm text-gray-300">{user?.name}</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeColors[role] || 'bg-gray-700 text-gray-300'}`}>
                                {role}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center text-sm text-gray-400 hover:text-red-400 transition-colors"
                            >
                                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Flash messages */}
                <Transition
                    show={showFlash}
                    enter="transition ease-out duration-300"
                    enterFrom="opacity-0 -translate-y-2"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 -translate-y-2"
                >
                    <div className="px-4 pt-4">
                        {flash?.success && (
                            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-center">
                                <CheckCircleIcon className="h-5 w-5 text-emerald-400 mr-3" />
                                <p className="text-sm text-emerald-300">{flash.success}</p>
                            </div>
                        )}
                        {flash?.error && (
                            <div className="rounded-md bg-red-500/10 border border-red-500/30 p-4 flex items-center">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                                <p className="text-sm text-red-300">{flash.error}</p>
                            </div>
                        )}
                    </div>
                </Transition>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
