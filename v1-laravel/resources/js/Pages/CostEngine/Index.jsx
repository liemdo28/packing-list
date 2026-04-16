import { Head, Link, router } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Pagination from '@/Components/Pagination';
import Badge from '@/Components/Badge';
import { CalculatorIcon, EyeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function CostEngineIndex({ items, rawMaterialCount }) {
    const handleRecalculateAll = () => {
        if (confirm('Recalculate costs for all items with recipes? This may take a moment.')) {
            router.post('/cost-engine/recalculate-all');
        }
    };

    const formatCurrency = (val) => {
        if (val === null || val === undefined) return '-';
        return '$' + Number(val).toFixed(2);
    };

    return (
        <Layout>
            <Head title="Cost Engine" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <CalculatorIcon className="h-7 w-7 text-emerald-400" />
                            Cost Engine
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            {rawMaterialCount} raw materials in database
                        </p>
                    </div>
                    <button
                        onClick={handleRecalculateAll}
                        className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
                    >
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Recalculate All
                    </button>
                </div>

                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Item Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Unit</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Recipe</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Latest Cost</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Cost/Unit</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Current Price</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Status</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {items?.data?.length > 0 ? (
                                    items.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-emerald-400">{item.code}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{item.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.unit}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {item.has_recipe ? (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/30">
                                                        Has Recipe
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-gray-500/10 px-2.5 py-0.5 text-xs font-medium text-gray-500 border border-gray-600/30">
                                                        No Recipe
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-white">
                                                {formatCurrency(item.latest_cost)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-cyan-400">
                                                {formatCurrency(item.cost_per_unit)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">
                                                {formatCurrency(item.current_price || null)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {item.cost_status === 'approved' && (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/30">
                                                        Approved
                                                    </span>
                                                )}
                                                {item.cost_status === 'draft' && (
                                                    <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400 border border-yellow-500/30">
                                                        Draft
                                                    </span>
                                                )}
                                                {!item.cost_status && (
                                                    <span className="text-gray-600">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <Link
                                                    href={`/cost-engine/${item.id}`}
                                                    className="inline-flex items-center text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                                                >
                                                    <EyeIcon className="h-4 w-4 mr-1" />
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-500">
                                            No items found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {items?.links && <Pagination links={items.links} />}
                </div>
            </div>
        </Layout>
    );
}
