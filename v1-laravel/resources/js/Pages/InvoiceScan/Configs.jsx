import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import {
    Cog6ToothIcon,
    PlusIcon,
    FolderOpenIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

export default function InvoiceScanConfigs({ configs = [], vendors = [], stores = [] }) {
    const form = useForm({
        vendor_id: '',
        store_id: '',
        folder_id: '',
        folder_name: '',
        folder_url: '',
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post('/invoice-scan/configs', {
            onSuccess: () => form.reset(),
        });
    };

    return (
        <Layout>
            <Head title="Folder Mappings" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Cog6ToothIcon className="h-7 w-7 text-yellow-400" />
                        Folder Mappings
                    </h1>
                    <Link
                        href="/invoice-scan"
                        className="inline-flex items-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-600 transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-1" />
                        Back to Scan
                    </Link>
                </div>

                {/* Existing Configs Table */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-700/50">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <FolderOpenIcon className="h-5 w-5 text-yellow-400" />
                            Configured Folders
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Vendor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Store</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Folder Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Folder ID</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Notes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created By</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {configs.length > 0 ? (
                                    configs.map((config) => (
                                        <tr key={config.id} className="hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                                {config.vendor?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {config.store?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {config.folder_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400 max-w-[200px] truncate">
                                                {config.folder_id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {config.active ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                                                        <CheckCircleIcon className="h-4 w-4" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                                                        <XCircleIcon className="h-4 w-4" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400 max-w-[200px] truncate">
                                                {config.notes || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {config.created_by_user?.name || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                                            No folder mappings configured yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add New Mapping Form */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <PlusIcon className="h-5 w-5 text-emerald-400" />
                        Add Folder Mapping
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Vendor</label>
                                <select
                                    value={form.data.vendor_id}
                                    onChange={(e) => form.setData('vendor_id', e.target.value)}
                                    className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                                >
                                    <option value="">Select Vendor</option>
                                    {vendors.map((v) => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                                {form.errors.vendor_id && <p className="mt-1 text-xs text-red-400">{form.errors.vendor_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Store (optional)</label>
                                <select
                                    value={form.data.store_id}
                                    onChange={(e) => form.setData('store_id', e.target.value)}
                                    className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                                >
                                    <option value="">Select Store</option>
                                    {stores.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Google Drive Folder ID</label>
                                <input
                                    type="text"
                                    value={form.data.folder_id}
                                    onChange={(e) => form.setData('folder_id', e.target.value)}
                                    className="block w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                                    placeholder="e.g., 1aBcDeFgHiJkLmNoPqRsT"
                                    required
                                />
                                {form.errors.folder_id && <p className="mt-1 text-xs text-red-400">{form.errors.folder_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Folder Name</label>
                                <input
                                    type="text"
                                    value={form.data.folder_name}
                                    onChange={(e) => form.setData('folder_name', e.target.value)}
                                    className="block w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                                    placeholder="e.g., Four Season Invoices 2024"
                                    required
                                />
                                {form.errors.folder_name && <p className="mt-1 text-xs text-red-400">{form.errors.folder_name}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                            <textarea
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                rows={2}
                                className="block w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                                placeholder="Optional notes about this folder..."
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 disabled:opacity-50"
                            >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                {form.processing ? 'Saving...' : 'Add Mapping'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
