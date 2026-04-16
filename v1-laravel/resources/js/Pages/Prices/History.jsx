import { Head, Link } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function PricesHistory({ item, prices = [] }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <Layout>
            <Head title={`Price History - ${item?.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/prices" className="text-gray-400 hover:text-white">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Price History</h1>
                        <p className="text-sm text-gray-400">{item?.code} - {item?.name} ({item?.unit})</p>
                    </div>
                </div>

                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Effective From</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Effective To</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Updated By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Updated At</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {prices.length > 0 ? (
                                    prices.map((price, idx) => (
                                        <tr key={price.id || idx} className={`hover:bg-gray-800/50 ${idx === 0 ? 'bg-red-500/10 border-l-2 border-red-500' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-400 text-right">
                                                {formatCurrency(price.price)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {price.effective_from ? new Date(price.effective_from).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {price.effective_to ? new Date(price.effective_to).toLocaleDateString() : 'Current'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {price.updater?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {price.updated_at ? new Date(price.updated_at).toLocaleString() : '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                                            No price history for this item.
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
