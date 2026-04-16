import { Head, Link } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import {
    DocumentMagnifyingGlassIcon,
    ArrowLeftIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

const months = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const parseStatusColors = {
    success: 'text-emerald-400',
    failed: 'text-red-400',
    pending: 'text-yellow-400',
    skipped: 'text-gray-400',
};

const actionColors = {
    updated: 'bg-emerald-500/10 border-emerald-500/20',
    kept: 'bg-yellow-500/10 border-yellow-500/20',
    skipped: 'bg-gray-500/10 border-gray-500/20',
    unmatched: 'bg-red-500/10 border-red-500/20',
};

const actionBadge = {
    updated: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    kept: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    skipped: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    unmatched: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function InvoiceScanResults({ scanJob }) {
    const files = scanJob?.files || [];
    const priceUpdates = scanJob?.price_updates || [];

    const unmatchedCount = priceUpdates.filter(p => p.action === 'unmatched').length;

    const formatCurrency = (val) => {
        if (val === null || val === undefined) return '-';
        return '$' + Number(val).toFixed(2);
    };

    return (
        <Layout>
            <Head title={`Scan Results #${scanJob.id}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <DocumentMagnifyingGlassIcon className="h-7 w-7 text-red-400" />
                        Scan Results
                        <span className="text-gray-400 text-lg font-normal">
                            {months[scanJob.month]} {scanJob.year}
                            {scanJob.vendor && ` - ${scanJob.vendor.name}`}
                        </span>
                    </h1>
                    <div className="flex gap-2">
                        {unmatchedCount > 0 && (
                            <Link
                                href={`/invoice-scan/review/${scanJob.id}`}
                                className="inline-flex items-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-500 transition-colors"
                            >
                                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                Review {unmatchedCount} Unmatched
                            </Link>
                        )}
                        <Link
                            href="/invoice-scan"
                            className="inline-flex items-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-600 transition-colors"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-1" />
                            Back
                        </Link>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-[#1e1e2e] border border-blue-500/30 rounded-lg p-4">
                        <p className="text-xs text-gray-400 uppercase">Files Found</p>
                        <p className="text-2xl font-bold text-blue-400">{scanJob.total_files}</p>
                    </div>
                    <div className="bg-[#1e1e2e] border border-emerald-500/30 rounded-lg p-4">
                        <p className="text-xs text-gray-400 uppercase">Parsed</p>
                        <p className="text-2xl font-bold text-emerald-400">{scanJob.parsed_files}</p>
                    </div>
                    <div className="bg-[#1e1e2e] border border-red-500/30 rounded-lg p-4">
                        <p className="text-xs text-gray-400 uppercase">Failed</p>
                        <p className="text-2xl font-bold text-red-400">{scanJob.failed_files}</p>
                    </div>
                    <div className="bg-[#1e1e2e] border border-purple-500/30 rounded-lg p-4">
                        <p className="text-xs text-gray-400 uppercase">Matched Items</p>
                        <p className="text-2xl font-bold text-purple-400">{scanJob.matched_items}</p>
                    </div>
                    <div className="bg-[#1e1e2e] border border-green-400/30 rounded-lg p-4 shadow-[0_0_15px_rgba(0,255,100,0.1)]">
                        <p className="text-xs text-gray-400 uppercase">Prices Updated</p>
                        <p className="text-2xl font-bold text-green-400">{scanJob.updated_prices}</p>
                    </div>
                    <div className="bg-[#1e1e2e] border border-yellow-500/30 rounded-lg p-4">
                        <p className="text-xs text-gray-400 uppercase">Kept Old</p>
                        <p className="text-2xl font-bold text-yellow-400">{scanJob.kept_old_prices}</p>
                    </div>
                </div>

                {/* Files Table */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-700/50">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                            Scanned Files
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">File Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Invoice #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Invoice Date</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Parse Status</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Items</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {files.map((file) => {
                                    const itemCount = priceUpdates.filter(p => p.scan_job_file_id === file.id).length;
                                    return (
                                        <tr key={file.id} className="hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{file.file_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 uppercase">{file.file_type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">{file.invoice_number_parsed || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {file.invoice_date_parsed ? new Date(file.invoice_date_parsed).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center gap-1 text-sm ${parseStatusColors[file.parse_status] || 'text-gray-400'}`}>
                                                    {file.parse_status === 'success' ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
                                                    {file.parse_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-purple-400">{itemCount}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Price Updates Table */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-700/50">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-400" />
                            Price Updates
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Item Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Matched To</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Unit</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Old Price</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">New Price</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Change</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {priceUpdates.map((update) => {
                                    const oldP = update.old_price ? parseFloat(update.old_price) : null;
                                    const newP = update.new_price ? parseFloat(update.new_price) : null;
                                    const diff = oldP !== null && newP !== null ? newP - oldP : null;
                                    const pctChange = oldP && diff ? ((diff / oldP) * 100).toFixed(1) : null;

                                    return (
                                        <tr key={update.id} className={`border ${actionColors[update.action] || ''} transition-colors`}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{update.raw_item_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {update.raw_material?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{update.unit || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">
                                                {formatCurrency(update.old_price)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-white">
                                                {formatCurrency(update.new_price)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                {diff !== null && diff !== 0 ? (
                                                    <span className={`inline-flex items-center gap-1 ${diff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {diff > 0 ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
                                                        {pctChange}%
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${actionBadge[update.action] || ''}`}>
                                                    {update.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400 max-w-[200px] truncate">{update.notes || '-'}</td>
                                        </tr>
                                    );
                                })}
                                {priceUpdates.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                                            No price updates found in this scan.
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
