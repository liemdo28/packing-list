import { Head, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';

export default function ItemsEdit({ item, categories = [], units = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        code: item.code || '',
        name: item.name || '',
        unit: item.unit || '',
        category: item.category || '',
        active: item.active ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/items/${item.id}`);
    };

    return (
        <Layout>
            <Head title={`Edit Item - ${item.name}`} />

            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-white mb-6">Edit Item: {item.name}</h1>

                <form onSubmit={handleSubmit} className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Code</label>
                        <input type="text" value={data.code} onChange={(e) => setData('code', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" required />
                        {errors.code && <p className="mt-1 text-sm text-red-400">{errors.code}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                        <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" required />
                        {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Unit</label>
                        <select value={data.unit} onChange={(e) => setData('unit', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" required>
                            <option value="">Select unit...</option>
                            {units.map((u) => (<option key={u} value={u}>{u}</option>))}
                        </select>
                        {errors.unit && <p className="mt-1 text-sm text-red-400">{errors.unit}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                        <select value={data.category} onChange={(e) => setData('category', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" required>
                            <option value="">Select category...</option>
                            {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                        </select>
                        {errors.category && <p className="mt-1 text-sm text-red-400">{errors.category}</p>}
                    </div>
                    <div className="flex items-center">
                        <input id="active" type="checkbox" checked={data.active} onChange={(e) => setData('active', e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-red-600 focus:ring-red-500" />
                        <label htmlFor="active" className="ml-2 block text-sm text-gray-300">Active</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => window.history.back()} className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={processing} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50">{processing ? 'Saving...' : 'Update Item'}</button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
