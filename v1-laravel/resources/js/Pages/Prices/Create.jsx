import { Head, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';

export default function PricesCreate({ items = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        item_id: '',
        price: '',
        effective_from: '',
        effective_to: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/prices');
    };

    return (
        <Layout>
            <Head title="Set Price" />

            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-white mb-6">Set Item Price</h1>

                <form onSubmit={handleSubmit} className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Item</label>
                        <select value={data.item_id} onChange={(e) => setData('item_id', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" required>
                            <option value="">Select item...</option>
                            {items.map((item) => (<option key={item.id} value={item.id}>{item.code} - {item.name} ({item.unit})</option>))}
                        </select>
                        {errors.item_id && <p className="mt-1 text-sm text-red-400">{errors.item_id}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Price (IDR)</label>
                        <input type="number" min="0" step="1" value={data.price} onChange={(e) => setData('price', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" placeholder="0" required />
                        {errors.price && <p className="mt-1 text-sm text-red-400">{errors.price}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Effective From</label>
                            <input type="date" value={data.effective_from} onChange={(e) => setData('effective_from', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" required />
                            {errors.effective_from && <p className="mt-1 text-sm text-red-400">{errors.effective_from}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Effective To (optional)</label>
                            <input type="date" value={data.effective_to} onChange={(e) => setData('effective_to', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" />
                            {errors.effective_to && <p className="mt-1 text-sm text-red-400">{errors.effective_to}</p>}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => window.history.back()} className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={processing} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50">{processing ? 'Saving...' : 'Set Price'}</button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
