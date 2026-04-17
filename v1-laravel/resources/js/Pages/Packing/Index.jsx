import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Badge from '@/Components/Badge';
import Pagination from '@/Components/Pagination';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';

const statusColors = {
    draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    packing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    packed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    shipped: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const typeColors = {
    shipment: 'bg-purple-500/20 text-purple-400',
    transfer: 'bg-orange-500/20 text-orange-400',
    event: 'bg-pink-500/20 text-pink-400',
};

export default function PackingIndex({ jobs, statuses = {}, types = {} }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;

    const [filters, setFilters] = useState({
        status: new URL(window.location).searchParams.get('status') || '',
        type: new URL(window.location).searchParams.get('type') || '',
        from_date: new URL(window.location).searchParams.get('from_date') || '',
        to_date: new URL(window.location).searchParams.get('to_date') || '',
    });

    const handleFilter = (e) => {
        e.preventDefault();
        router.visit('/packing', { data: filters, preserveState: true, replace: true });
    };

    const handleReset = () => {
        setFilters({ status: '', type: '', from_date: '', to_date: '' });
        router.visit('/packing', { replace: true });
    };

    return (
        <Layout>
            <Head title="Packing Jobs" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-2xl font-bold text-white">Packing Jobs</h1>
                    <div className="flex gap-2">
                        <Link
                            href="/packing/templates"
                            className="inline-flex items-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
                        >
                            Templates
                        </Link>
                        {role === 'admin' && (
                            <Link
                                href="/packing/create"
                                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                            >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                New Packing Job
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <form onSubmit={handleFilter} className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="rounded-md bg-[#2a2a3e] border border-gray-600 px-3 py-2 text-sm text-white"
                        >
                            <option value="">All Statuses</option>
                            {Object.entries(statuses).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="rounded-md bg-[#2a2a3e] border border-gray-600 px-3 py-2 text-sm text-white"
                        >
                            <option value="">All Types</option>
                            {Object.entries(types).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={filters.from_date}
                            onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                            className="rounded-md bg-[#2a2a3e] border border-gray-600 px-3 py-2 text-sm text-white"
                        />
                        <input
                            type="date"
                            value={filters.to_date}
                            onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                            className="rounded-md bg-[#2a2a3e] border border-gray-600 px-3 py-2 text-sm text-white"
                        />
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button
                            type="submit"
                            className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500"
                        >
                            <FunnelIcon className="h-4 w-4 mr-1" />
                            Filter
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex items-center rounded-md bg-gray-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-500"
                        >
                            Reset
                        </button>
                    </div>
                </form>

                {/* Table */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-[#16161f]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Job</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Store</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Progress</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {jobs.data.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No packing jobs found.</td>
                                </tr>
                            ) : jobs.data.map((job) => (
                                <tr key={job.id} className="hover:bg-[#2a2a3e]/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-white">{job.name}</div>
                                        {job.order && (
                                            <div className="text-xs text-gray-500">Order: {job.order.order_number}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[job.type] || 'bg-gray-500/20 text-gray-400'}`}>
                                            {job.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${statusColors[job.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                                            {statuses[job.status] || job.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-400">{job.from_store?.name || '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-gray-700 rounded-full h-1.5">
                                                <div
                                                    className="bg-emerald-500 h-1.5 rounded-full transition-all"
                                                    style={{ width: `${job.progress || 0}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-400">{job.progress || 0}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/packing/${job.id}`}
                                            className="text-sm text-red-400 hover:text-red-300 font-medium"
                                        >
                                            View →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination links={jobs.links} />
            </div>
        </Layout>
    );
}
