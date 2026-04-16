import { Head, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function OrdersCreate({ fromStore, destinationStores = [], items = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        to_store_id: '',
        notes: '',
        lines: [{ item_id: '', quantity: 1 }],
    });

    const addLine = () => {
        setData('lines', [...data.lines, { item_id: '', quantity: 1 }]);
    };

    const removeLine = (index) => {
        if (data.lines.length <= 1) return;
        setData('lines', data.lines.filter((_, i) => i !== index));
    };

    const updateLine = (index, field, value) => {
        const updated = data.lines.map((line, i) =>
            i === index ? { ...line, [field]: value } : line
        );
        setData('lines', updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/orders');
    };

    return (
        <Layout>
            <Head title="Create Order" />

            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-white mb-6">Create New Order</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">From Store</label>
                                <input
                                    type="text"
                                    value={fromStore?.name || ''}
                                    disabled
                                    className="block w-full rounded-md bg-gray-700 border-gray-600 text-gray-400 shadow-sm sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Destination Store</label>
                                <select
                                    value={data.to_store_id}
                                    onChange={(e) => setData('to_store_id', e.target.value)}
                                    className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                    required
                                >
                                    <option value="">Select destination...</option>
                                    {destinationStores.map((store) => (
                                        <option key={store.id} value={store.id}>{store.name}</option>
                                    ))}
                                </select>
                                {errors.to_store_id && <p className="mt-1 text-sm text-red-400">{errors.to_store_id}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={3}
                                className="block w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                placeholder="Optional notes..."
                            />
                            {errors.notes && <p className="mt-1 text-sm text-red-400">{errors.notes}</p>}
                        </div>
                    </div>

                    {/* Order lines */}
                    <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-white">Order Items</h2>
                            <button
                                type="button"
                                onClick={addLine}
                                className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                            >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Add Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {data.lines.map((line, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className="flex-1">
                                        <select
                                            value={line.item_id}
                                            onChange={(e) => updateLine(index, 'item_id', e.target.value)}
                                            className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                            required
                                        >
                                            <option value="">Select item...</option>
                                            {items.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.code} - {item.name} ({item.unit})
                                                </option>
                                            ))}
                                        </select>
                                        {errors[`lines.${index}.item_id`] && (
                                            <p className="mt-1 text-sm text-red-400">{errors[`lines.${index}.item_id`]}</p>
                                        )}
                                    </div>
                                    <div className="w-32">
                                        <input
                                            type="number"
                                            min="1"
                                            value={line.quantity}
                                            onChange={(e) => updateLine(index, 'quantity', parseInt(e.target.value) || 1)}
                                            className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                            placeholder="Qty"
                                            required
                                        />
                                        {errors[`lines.${index}.quantity`] && (
                                            <p className="mt-1 text-sm text-red-400">{errors[`lines.${index}.quantity`]}</p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeLine(index)}
                                        disabled={data.lines.length <= 1}
                                        className="mt-1 text-red-500 hover:text-red-400 disabled:text-gray-600 disabled:cursor-not-allowed"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {errors.lines && <p className="mt-2 text-sm text-red-400">{errors.lines}</p>}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                        >
                            {processing ? 'Creating...' : 'Create Order'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
