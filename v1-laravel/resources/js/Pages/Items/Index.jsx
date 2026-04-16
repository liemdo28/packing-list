import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Badge from '@/Components/Badge';
import Pagination from '@/Components/Pagination';
import { PlusIcon, PencilSquareIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function ItemsIndex({ items, categories = [], filters: initialFilters = {} }) {
    const [search, setSearch] = useState(initialFilters.search || '');
    const [category, setCategory] = useState(initialFilters.category || '');

    const handleFilter = (e) => {
        e.preventDefault();
        router.visit('/items', {
            data: { search, category },
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setCategory('');
        router.visit('/items', { replace: true });
    };

    return (
        <Layout>
            <Head title="Items" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Items</h1>
                    <Link
                        href="/items/create"
                        className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Item
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
                                    className="block w-full pl-10 rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                    placeholder="Search by code or name..."
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                            >
                                Filter
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="inline-flex items-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-200 shadow-sm hover:bg-gray-600"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Unit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {items?.data?.length > 0 ? (
                                    items.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.code}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{item.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.unit}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.category}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge status={item.active ? 'active' : 'inactive'} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Link href={`/items/${item.id}/edit`} className="text-blue-400 hover:text-blue-300 inline-flex items-center">
                                                    <PencilSquareIcon className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No items found.</td>
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
