import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import StatCard from '@/Components/StatCard';
import {
    DocumentMagnifyingGlassIcon,
    FolderOpenIcon,
    CloudArrowDownIcon,
    CheckCircleIcon,
    PlayIcon,
    Cog6ToothIcon,
    EyeIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function InvoiceScanIndex({ vendors = [], driveConfigs = [], recentScans = [] }) {
    const now = new Date();
    const form = useForm({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        vendor_id: '',
    });

    const handleScan = (e) => {
        e.preventDefault();
        form.post('/invoice-scan/scan');
    };

    const years = [];
    for (let y = 2020; y <= 2030; y++) years.push(y);

    return (
        <Layout>
            <Head title="Invoice Scan" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <DocumentMagnifyingGlassIcon className="h-7 w-7 text-red-400" />
                        Invoice Scan
                    </h1>
                    <Link
                        href="/invoice-scan/configs"
                        className="inline-flex items-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-600 transition-colors"
                    >
                        <Cog6ToothIcon className="h-4 w-4 mr-1" />
                        Manage Folders
                    </Link>
                </div>

                {/* Connection Status */}
                <div className="bg-[#1e1e2e] border border-emerald-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                            <CloudArrowDownIcon className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-emerald-400">Google Drive Connected</h3>
                            <p className="text-xs text-gray-400">
                                {driveConfigs.length} folder{driveConfigs.length !== 1 ? 's' : ''} mapped
                                {' '}&middot;{' '}
                                {vendors.length} active vendor{vendors.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Folder Mappings Summary */}
                {driveConfigs.length > 0 && (
                    <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                            <FolderOpenIcon className="h-4 w-4 text-yellow-400" />
                            Folder Mappings
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {driveConfigs.map((config) => (
                                <div key={config.id} className="bg-gray-800/50 border border-gray-700/50 rounded-md p-3">
                                    <p className="text-sm font-medium text-white">{config.vendor?.name || 'General'}</p>
                                    <p className="text-xs text-gray-400 truncate">{config.folder_name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Scan Section */}
                <div className="bg-[#1e1e2e] border border-red-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Run Invoice Scan</h3>
                    <form onSubmit={handleScan} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Month</label>
                                <select
                                    value={form.data.month}
                                    onChange={(e) => form.setData('month', parseInt(e.target.value))}
                                    className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                >
                                    {months.map((m) => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Year</label>
                                <select
                                    value={form.data.year}
                                    onChange={(e) => form.setData('year', parseInt(e.target.value))}
                                    className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Vendor (optional)</label>
                                <select
                                    value={form.data.vendor_id}
                                    onChange={(e) => form.setData('vendor_id', e.target.value)}
                                    className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                >
                                    <option value="">All Vendors</option>
                                    {vendors.map((v) => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {form.errors && Object.keys(form.errors).length > 0 && (
                            <div className="rounded-md bg-red-500/10 border border-red-500/30 p-3">
                                {Object.values(form.errors).map((err, i) => (
                                    <p key={i} className="text-sm text-red-400">{err}</p>
                                ))}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center rounded-md bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 hover:shadow-red-500/40 transition-all disabled:opacity-50"
                        >
                            <PlayIcon className="h-5 w-5 mr-2" />
                            {form.processing ? 'Scanning...' : 'Scan Invoices'}
                        </button>
                    </form>
                </div>

                {/* Recent Scans Table */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-700/50">
                        <h3 className="text-lg font-semibold text-white">Recent Scans</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Vendor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Month</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Files</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Parsed</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Matched</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Updated</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Status</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {recentScans.length > 0 ? (
                                    recentScans.map((scan) => (
                                        <tr key={scan.id} className="hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {new Date(scan.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {scan.vendor?.name || 'All'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {months.find(m => m.value === scan.month)?.label} {scan.year}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-400">{scan.total_files}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-emerald-400">{scan.parsed_files}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-purple-400">{scan.matched_items}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">{scan.updated_prices}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusColors[scan.status] || ''}`}>
                                                    {scan.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/invoice-scan/results/${scan.id}`}
                                                        className="text-blue-400 hover:text-blue-300 inline-flex items-center text-sm"
                                                    >
                                                        <EyeIcon className="h-4 w-4 mr-1" />
                                                        View
                                                    </Link>
                                                    {scan.status === 'completed' && (
                                                        <Link
                                                            href={`/invoice-scan/review/${scan.id}`}
                                                            className="text-yellow-400 hover:text-yellow-300 inline-flex items-center text-sm"
                                                        >
                                                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                                            Review
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-500">
                                            No scans yet. Run your first invoice scan above.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
