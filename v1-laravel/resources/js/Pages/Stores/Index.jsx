import { Head, Link, router } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Badge from '@/Components/Badge';
import Pagination from '@/Components/Pagination';
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

export default function StoresIndex({ stores }) {
    return (
        <Layout>
            <Head title="Stores" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Stores</h1>
                    <Link
                        href="/stores/create"
                        className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Store
                    </Link>
                </div>

                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Address</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {stores?.data?.length > 0 ? (
                                    stores.data.map((store) => (
                                        <tr key={store.id} className="hover:bg-gray-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{store.code}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{store.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">{store.address}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{store.phone}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge status={store.active ? 'active' : 'inactive'} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Link href={`/stores/${store.id}/edit`} className="text-blue-400 hover:text-blue-300 inline-flex items-center">
                                                    <PencilSquareIcon className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No stores found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {stores?.links && <Pagination links={stores.links} />}
                </div>
            </div>
        </Layout>
    );
}
