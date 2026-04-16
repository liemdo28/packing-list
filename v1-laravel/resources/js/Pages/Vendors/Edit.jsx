import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import {
    TruckIcon,
    ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export default function VendorsEdit({ vendor }) {
    const form = useForm({
        code: vendor.code || '',
        name: vendor.name || '',
        active: vendor.active ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        form.put(`/vendors/${vendor.id}`);
    };

    return (
        <Layout>
            <Head title={`Edit Vendor: ${vendor.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <TruckIcon className="h-7 w-7 text-orange-400" />
                        Edit Vendor
                        <span className="text-gray-400 text-lg font-normal">- {vendor.name}</span>
                    </h1>
                    <Link
                        href="/vendors"
                        className="inline-flex items-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-600 transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-1" />
                        Back
                    </Link>
                </div>

                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6 max-w-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Vendor Code</label>
                            <input
                                type="text"
                                value={form.data.code}
                                onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                                className="block w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                required
                            />
                            {form.errors.code && <p className="mt-1 text-xs text-red-400">{form.errors.code}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Vendor Name</label>
                            <input
                                type="text"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                className="block w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                required
                            />
                            {form.errors.name && <p className="mt-1 text-xs text-red-400">{form.errors.name}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="active"
                                checked={form.data.active}
                                onChange={(e) => form.setData('active', e.target.checked)}
                                className="rounded bg-gray-800 border-gray-600 text-orange-500 focus:ring-orange-500"
                            />
                            <label htmlFor="active" className="text-sm text-gray-300">Active</label>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Link
                                href="/vendors"
                                className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-600"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
                            >
                                {form.processing ? 'Saving...' : 'Update Vendor'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
