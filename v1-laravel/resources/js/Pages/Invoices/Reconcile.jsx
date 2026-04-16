import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Badge from '@/Components/Badge';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function InvoicesReconcile({ invoice, completedOrders = [] }) {
    const [selectedOrders, setSelectedOrders] = useState(
        invoice.matched_order_ids || []
    );

    const { data, setData, post, processing, errors } = useForm({
        order_ids: invoice.matched_order_ids || [],
        status: invoice.status || 'unpaid',
        notes: '',
    });

    const toggleOrder = (orderId) => {
        const updated = selectedOrders.includes(orderId)
            ? selectedOrders.filter((id) => id !== orderId)
            : [...selectedOrders, orderId];
        setSelectedOrders(updated);
        setData('order_ids', updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/invoices/${invoice.id}/reconcile`);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <Layout>
            <Head title={`Reconcile Invoice ${invoice.invoice_number}`} />

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={`/invoices/${invoice.id}`} className="text-gray-400 hover:text-white">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Reconcile Invoice {invoice.invoice_number}</h1>
                        <p className="text-sm text-gray-400">
                            {invoice.from_store?.name} to {invoice.to_store?.name} - Period: {invoice.period_month}/{invoice.period_year}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Invoice summary */}
                    <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Invoice Summary</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">Invoice Total</p>
                                <p className="text-2xl font-bold text-emerald-400 glow-green">{formatCurrency(invoice.total || 0)}</p>
                            </div>
                            <Badge status={invoice.status} />
                        </div>
                    </div>

                    {/* Match with completed orders */}
                    <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-700/50">
                            <h3 className="text-lg font-medium text-white">Match with Completed Orders</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                Select the completed orders that correspond to this invoice.
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700/50">
                                <thead className="bg-[#252540]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase w-10">
                                            <span className="sr-only">Select</span>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Items</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/50">
                                    {completedOrders.length > 0 ? (
                                        completedOrders.map((order) => (
                                            <tr
                                                key={order.id}
                                                className={`cursor-pointer hover:bg-gray-800/50 ${
                                                    selectedOrders.includes(order.id) ? 'bg-red-500/10' : ''
                                                }`}
                                                onClick={() => toggleOrder(order.id)}
                                            >
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedOrders.includes(order.id)}
                                                        onChange={() => toggleOrder(order.id)}
                                                        className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-red-600 focus:ring-red-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-white">{order.order_number}</td>
                                                <td className="px-6 py-4 text-sm text-gray-400">
                                                    {order.completed_at ? new Date(order.completed_at).toLocaleDateString() : ''}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-400 text-right">
                                                    {order.lines_count ?? order.lines?.length ?? 0}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-emerald-400 text-right">
                                                    {formatCurrency(order.total || 0)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                                                No completed orders available for reconciliation.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Status update */}
                    <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Update Status</label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="block w-full max-w-xs rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                            >
                                <option value="unpaid">Unpaid</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={2}
                                className="block w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                placeholder="Reconciliation notes..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => window.history.back()} className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={processing} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50">{processing ? 'Saving...' : 'Save Reconciliation'}</button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
