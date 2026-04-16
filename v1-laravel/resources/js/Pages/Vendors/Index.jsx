import { Head, Link } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Pagination from '@/Components/Pagination';
import {
    TruckIcon,
    PlusIcon,
    PencilSquareIcon,
    CheckCircleIcon,
    XCircleIcon,
    FolderOpenIcon,
    LinkIcon,
} from '@heroicons/react/24/outline';

export default function VendorsIndex({ vendors }) {
    return (
        <Layout>
            <Head title="Vendors" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <TruckIcon className="h-7 w-7 text-orange-400" />
                        Vendors
                    </h1>
                    <Link
                        href="/vendors/create"
                        className="inline-flex items-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500"
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Vendor
                    </Link>
                </div>

                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Status</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Item Mappings</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Drive Folders</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {vendors?.data?.length > 0 ? (
                                    vendors.data.map((vendor) => (
                                        <tr key={vendor.id} className="hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-orange-400">{vendor.code}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{vendor.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {vendor.active ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                                                        <CheckCircleIcon className="h-3 w-3" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 text-xs font-medium text-red-400">
                                                        <XCircleIcon className="h-3 w-3" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="inline-flex items-center gap-1 text-sm text-purple-400">
                                                    <LinkIcon className="h-3 w-3" />
                                                    {vendor.vendor_item_mappings_count || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="inline-flex items-center gap-1 text-sm text-yellow-400">
                                                    <FolderOpenIcon className="h-3 w-3" />
                                                    {vendor.google_drive_configs_count || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <Link
                                                    href={`/vendors/${vendor.id}/edit`}
                                                    className="text-blue-400 hover:text-blue-300 inline-flex items-center text-sm"
                                                >
                                                    <PencilSquareIcon className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No vendors found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {vendors?.links && <Pagination links={vendors.links} />}
                </div>
            </div>
        </Layout>
    );
}
