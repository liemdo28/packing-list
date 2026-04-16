import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Badge from '@/Components/Badge';
import Pagination from '@/Components/Pagination';
import { PlusIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function OrdersIndex({ orders, statuses = [] }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;

    const [filters, setFilters] = useState({
        status: new URL(window.location).searchParams.get('status') || '',
        from_date: new URL(window.location).searchParams.get('from_date') || '',
        to_date: new URL(window.location).searchParams.get('to_date') || '',
    });

    const handleFilter = (e) => {
        e.preventDefault();
        router.visit('/orders', {
            data: filters,
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setFilters({ status: '', from_date: '', to_date: '' });
        router.visit('/orders', { replace: true });
    };

    const handleExport = () => {
        window.location.href = `/orders/export?${new URLSearchParams(filters).toString()}`;
    };

    return (
        <Layout>
            <Head title="Orders" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-2xl font-bold text-white">Orders</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
                        >
                            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                            Export Excel
                        </button>
                        {role === 'store' && (
                            <Link
                                href="/orders/create"
                                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                            >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                New Order
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-4">
                    <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                            >
                                <option value="">All Statuses</option>
                                {statuses.map((s) => (
                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-1">From Date</label>
                            <input
                                type="date"
                                value={filters.from_date}
                                onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                                className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-1">To Date</label>
                            <input
                                type="date"
                                value={filters.to_date}
                                onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                                className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                            >
                                <FunnelIcon className="h-4 w-4 mr-1" />
                                Filter
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="inline-flex items-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-200 shadow-sm hover:bg-gray-600"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </div>

                {/* Orders table */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">From</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">To</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {orders?.data?.length > 0 ? (
                                    orders.data.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                                {order.order_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {order.from_store?.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {order.to_store?.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {order.lines_count ?? order.lines?.length ?? 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge status={order.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Link href={`/orders/${order.id}`} className="text-blue-400 hover:text-blue-300">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                                            No orders found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {orders?.links && <Pagination links={orders.links} />}
                </div>
            </div>
        </Layout>
    );
}
