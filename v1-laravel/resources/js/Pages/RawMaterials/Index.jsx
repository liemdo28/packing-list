import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Pagination from '@/Components/Pagination';
import Modal from '@/Components/Modal';
import {
    PlusIcon,
    PencilSquareIcon,
    CurrencyDollarIcon,
    MagnifyingGlassIcon,
    BeakerIcon,
} from '@heroicons/react/24/outline';

export default function RawMaterialsIndex({ materials, categories = [], filters: initialFilters = {} }) {
    const [search, setSearch] = useState(initialFilters.search || '');
    const [category, setCategory] = useState(initialFilters.category || '');
    const [priceModal, setPriceModal] = useState(null);

    const priceForm = useForm({
        vendor_name: '',
        unit: '',
        unit_price: '',
        effective_date: new Date().toISOString().split('T')[0],
        source: 'manual',
    });

    const handleFilter = (e) => {
        e.preventDefault();
        router.visit('/raw-materials', { data: { search, category }, preserveState: true, replace: true });
    };

    const handleReset = () => {
        setSearch('');
        setCategory('');
        router.visit('/raw-materials', { replace: true });
    };

    const openPriceModal = (material) => {
        priceForm.setData({
            vendor_name: '',
            unit: material.base_unit,
            unit_price: '',
            effective_date: new Date().toISOString().split('T')[0],
            source: 'manual',
        });
        setPriceModal(material);
    };

    const submitPrice = (e) => {
        e.preventDefault();
        priceForm.post(`/raw-materials/${priceModal.id}/price`, {
            onSuccess: () => setPriceModal(null),
        });
    };

    const formatCurrency = (val) => {
        if (val === null || val === undefined) return '-';
        return '$' + Number(val).toFixed(2);
    };

    return (
        <Layout>
            <Head title="Raw Materials" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BeakerIcon className="h-7 w-7 text-purple-400" />
                        Raw Materials
                    </h1>
                    <Link
                        href="/raw-materials/create"
                        className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500"
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Material
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-4">
                    <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Search</label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="block w-full pl-10 rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                                    placeholder="Search by code or name..."
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500">Filter</button>
                            <button type="button" onClick={handleReset} className="inline-flex items-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-200 shadow-sm hover:bg-gray-600">Reset</button>
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Base Unit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Latest Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Vendor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Price Date</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {materials?.data?.length > 0 ? (
                                    materials.data.map((m) => (
                                        <tr key={m.id} className="hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-purple-400">{m.code}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{m.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{m.base_unit}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{m.category || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-400">
                                                {m.latest_price !== null ? `${formatCurrency(m.latest_price)}/${m.latest_price_unit}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{m.latest_vendor || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.latest_price_date || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <Link href={`/raw-materials/${m.id}/edit`} className="text-blue-400 hover:text-blue-300 inline-flex items-center text-sm">
                                                        <PencilSquareIcon className="h-4 w-4 mr-1" />
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => openPriceModal(m)}
                                                        className="text-emerald-400 hover:text-emerald-300 inline-flex items-center text-sm"
                                                    >
                                                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                                        Price
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">No raw materials found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {materials?.links && <Pagination links={materials.links} />}
                </div>
            </div>

            {/* Update Price Modal */}
            <Modal show={!!priceModal} onClose={() => setPriceModal(null)} maxWidth="md">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Update Price: {priceModal?.name}
                    </h3>
                    <form onSubmit={submitPrice} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Vendor Name</label>
                            <input
                                type="text"
                                value={priceForm.data.vendor_name}
                                onChange={(e) => priceForm.setData('vendor_name', e.target.value)}
                                className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                placeholder="e.g., Costco, Restaurant Depot"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Unit</label>
                                <input
                                    type="text"
                                    value={priceForm.data.unit}
                                    onChange={(e) => priceForm.setData('unit', e.target.value)}
                                    className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Unit Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={priceForm.data.unit_price}
                                    onChange={(e) => priceForm.setData('unit_price', e.target.value)}
                                    className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Effective Date</label>
                                <input
                                    type="date"
                                    value={priceForm.data.effective_date}
                                    onChange={(e) => priceForm.setData('effective_date', e.target.value)}
                                    className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Source</label>
                                <select
                                    value={priceForm.data.source}
                                    onChange={(e) => priceForm.setData('source', e.target.value)}
                                    className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                    required
                                >
                                    <option value="manual">Manual</option>
                                    <option value="invoice">Invoice</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setPriceModal(null)}
                                className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={priceForm.processing}
                                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                            >
                                {priceForm.processing ? 'Saving...' : 'Save Price'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </Layout>
    );
}
