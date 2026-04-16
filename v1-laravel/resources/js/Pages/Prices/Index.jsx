import { Head, Link } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Pagination from '@/Components/Pagination';
import { PlusIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function PricesIndex({ prices, items = [] }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <Layout>
            <Head title="Prices" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Prices</h1>
                    <Link
                        href="/prices/create"
                        className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Set Price
                    </Link>
                </div>

                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Item</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Effective From</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Effective To</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {prices?.data?.length > 0 ? (
                                    prices.data.map((price) => (
                                        <tr key={price.id} className="hover:bg-gray-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                                                <div className="font-medium text-white">{price.item?.name}</div>
                                                <div className="text-gray-500 text-xs">{price.item?.code}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-400 text-right font-medium">
                                                {formatCurrency(price.price)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {price.effective_from ? new Date(price.effective_from).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {price.effective_to ? new Date(price.effective_to).toLocaleDateString() : 'Current'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Link
                                                    href={`/prices/history/${price.item_id || price.item?.id}`}
                                                    className="text-blue-400 hover:text-blue-300 inline-flex items-center"
                                                >
                                                    <ClockIcon className="h-4 w-4 mr-1" />
                                                    History
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">No prices found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {prices?.links && <Pagination links={prices.links} />}
                </div>
            </div>
        </Layout>
    );
}
