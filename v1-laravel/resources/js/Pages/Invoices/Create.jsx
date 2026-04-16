import { Head, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function InvoicesCreate({ stores = [], items = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        from_store_id: '',
        to_store_id: '',
        period_month: new Date().getMonth() + 1,
        period_year: new Date().getFullYear(),
        notes: '',
        lines: [{ item_id: '', quantity: 0, unit_price: 0 }],
    });

    const addLine = () => {
        setData('lines', [...data.lines, { item_id: '', quantity: 0, unit_price: 0 }]);
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

    const lineTotal = (line) => (line.quantity || 0) * (line.unit_price || 0);
    const grandTotal = data.lines.reduce((sum, line) => sum + lineTotal(line), 0);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/invoices');
    };

    const months = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
        { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
        { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
    ];

    return (
        <Layout>
            <Head title="Create Invoice" />

            <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold text-white mb-6">Create Invoice</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">From Store</label>
                                <select value={data.from_store_id} onChange={(e) => setData('from_store_id', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" required>
                                    <option value="">Select store...</option>
                                    {stores.map((store) => (<option key={store.id} value={store.id}>{store.name}</option>))}
                                </select>
                                {errors.from_store_id && <p className="mt-1 text-sm text-red-400">{errors.from_store_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">To Store</label>
                                <select value={data.to_store_id} onChange={(e) => setData('to_store_id', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" required>
                                    <option value="">Select store...</option>
                                    {stores.map((store) => (<option key={store.id} value={store.id}>{store.name}</option>))}
                                </select>
                                {errors.to_store_id && <p className="mt-1 text-sm text-red-400">{errors.to_store_id}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Period Month</label>
                                <select value={data.period_month} onChange={(e) => setData('period_month', parseInt(e.target.value))} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm">
                                    {months.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Period Year</label>
                                <input type="number" value={data.period_year} onChange={(e) => setData('period_year', parseInt(e.target.value))} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                            <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={2} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" placeholder="Optional notes..." />
                        </div>
                    </div>

                    {/* Invoice lines */}
                    <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-white">Invoice Lines</h2>
                            <button type="button" onClick={addLine} className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500">
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Add Line
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700/50">
                                <thead className="bg-[#252540]">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Item</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Quantity</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Unit Price</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                                        <th className="px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/50">
                                    {data.lines.map((line, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-2">
                                                <select value={line.item_id} onChange={(e) => updateLine(index, 'item_id', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" required>
                                                    <option value="">Select item...</option>
                                                    {items.map((item) => (<option key={item.id} value={item.id}>{item.code} - {item.name}</option>))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <input type="number" min="0" value={line.quantity} onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)} className="block w-24 rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-right" />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input type="number" min="0" value={line.unit_price} onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value) || 0)} className="block w-32 rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-right" />
                                            </td>
                                            <td className="px-4 py-2 text-sm font-medium text-emerald-400 text-right">{formatCurrency(lineTotal(line))}</td>
                                            <td className="px-4 py-2">
                                                <button type="button" onClick={() => removeLine(index)} disabled={data.lines.length <= 1} className="text-red-500 hover:text-red-400 disabled:text-gray-600">
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-[#252540]">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-sm font-bold text-white text-right">Grand Total</td>
                                        <td className="px-4 py-3 text-sm font-bold text-emerald-400 text-right glow-green">{formatCurrency(grandTotal)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        {errors.lines && <p className="mt-2 text-sm text-red-400">{errors.lines}</p>}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => window.history.back()} className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={processing} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50">{processing ? 'Creating...' : 'Create Invoice'}</button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
