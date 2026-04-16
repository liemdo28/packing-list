import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import {
    ExclamationTriangleIcon,
    ArrowLeftIcon,
    CheckIcon,
    ForwardIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const months = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export default function InvoiceScanReview({ scanJob, unmatchedItems = [], rawMaterials = [] }) {
    const [mappings, setMappings] = useState({});
    const [processing, setProcessing] = useState({});
    const [search, setSearch] = useState('');

    const filteredItems = unmatchedItems.filter(item =>
        !search || item.raw_item_name.toLowerCase().includes(search.toLowerCase())
    );

    const handleMap = (priceUpdateId) => {
        const rawMaterialId = mappings[priceUpdateId];
        if (!rawMaterialId) return;

        setProcessing(prev => ({ ...prev, [priceUpdateId]: true }));

        router.post('/invoice-scan/map-item', {
            price_update_id: priceUpdateId,
            raw_material_id: rawMaterialId,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(prev => ({ ...prev, [priceUpdateId]: false }));
            },
        });
    };

    const parseSuggestion = (notes) => {
        if (!notes) return null;
        const match = notes.match(/Suggested:\s*(.+?)\s*\((\d+(?:\.\d+)?)%\)/);
        if (match) {
            return { name: match[1], score: parseFloat(match[2]) };
        }
        return null;
    };

    const getScoreColor = (score) => {
        if (score >= 70) return 'text-yellow-400';
        if (score >= 50) return 'text-orange-400';
        return 'text-red-400';
    };

    const formatCurrency = (val) => {
        if (val === null || val === undefined) return '-';
        return '$' + Number(val).toFixed(2);
    };

    return (
        <Layout>
            <Head title={`Review Unmatched - Scan #${scanJob.id}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-7 w-7 text-yellow-400" />
                        Review Unmatched Items
                        <span className="text-gray-400 text-lg font-normal">
                            {months[scanJob.month]} {scanJob.year}
                        </span>
                    </h1>
                    <Link
                        href={`/invoice-scan/results/${scanJob.id}`}
                        className="inline-flex items-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-600 transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-1" />
                        Back to Results
                    </Link>
                </div>

                {/* Info banner */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-sm text-yellow-300">
                        {unmatchedItems.length} item{unmatchedItems.length !== 1 ? 's' : ''} could not be automatically matched to raw materials.
                        Review each item below and manually map it to the correct raw material, or skip if not applicable.
                    </p>
                </div>

                {/* Search */}
                {unmatchedItems.length > 5 && (
                    <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-4">
                        <div className="relative max-w-md">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="block w-full pl-10 rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                                placeholder="Search items..."
                            />
                        </div>
                    </div>
                )}

                {/* Unmatched Items Table */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Vendor Item Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Suggested Match</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Confidence</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Map To</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => {
                                        const suggestion = parseSuggestion(item.notes);

                                        return (
                                            <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                                    {item.raw_item_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-400">
                                                    {formatCurrency(item.new_price)}{item.unit ? `/${item.unit}` : ''}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {suggestion ? suggestion.name : 'No match found'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                    {suggestion ? (
                                                        <span className={`font-medium ${getScoreColor(suggestion.score)}`}>
                                                            {suggestion.score}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select
                                                        value={mappings[item.id] || ''}
                                                        onChange={(e) => setMappings(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                        className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
                                                    >
                                                        <option value="">Select raw material...</option>
                                                        {rawMaterials.map((rm) => (
                                                            <option key={rm.id} value={rm.id}>{rm.name} ({rm.base_unit})</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => handleMap(item.id)}
                                                        disabled={!mappings[item.id] || processing[item.id]}
                                                        className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed mr-2"
                                                    >
                                                        <CheckIcon className="h-3 w-3 mr-1" />
                                                        {processing[item.id] ? 'Mapping...' : 'Map'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                                            {unmatchedItems.length === 0
                                                ? 'All items have been matched. Great job!'
                                                : 'No items match your search.'}
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
