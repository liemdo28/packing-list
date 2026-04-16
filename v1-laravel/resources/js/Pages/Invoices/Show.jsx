import { Head, Link } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Badge from '@/Components/Badge';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function InvoicesShow({ invoice }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <Layout>
            <Head title={`Invoice ${invoice.invoice_number}`} />

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/invoices" className="text-gray-400 hover:text-white">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white">Invoice {invoice.invoice_number}</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Created on {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : ''}
                        </p>
                    </div>
                    <Badge status={invoice.status} />
                </div>

                {/* Invoice details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Invoice Details</h3>
                        <dl className="space-y-3">
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-400">Invoice Number</dt>
                                <dd className="text-sm font-medium text-white">{invoice.invoice_number}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-400">From Store</dt>
                                <dd className="text-sm font-medium text-white">{invoice.from_store?.name}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-400">To Store</dt>
                                <dd className="text-sm font-medium text-white">{invoice.to_store?.name}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-400">Period</dt>
                                <dd className="text-sm font-medium text-white">{invoice.period_month}/{invoice.period_year}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-400">Status</dt>
                                <dd><Badge status={invoice.status} /></dd>
                            </div>
                        </dl>
                    </div>
                    <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Summary</h3>
                        <dl className="space-y-3">
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-400">Total Lines</dt>
                                <dd className="text-sm font-medium text-white">{invoice.lines?.length || 0}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-400">Grand Total</dt>
                                <dd className="text-lg font-bold text-emerald-400 glow-green">{formatCurrency(invoice.total || 0)}</dd>
                            </div>
                            {invoice.notes && (
                                <div>
                                    <dt className="text-sm text-gray-400 mb-1">Notes</dt>
                                    <dd className="text-sm text-gray-200 bg-gray-800/50 p-2 rounded border border-gray-700/50">{invoice.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {/* Invoice lines */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-700/50">
                        <h3 className="text-lg font-medium text-white">Invoice Lines</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Item</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Quantity</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Unit Price</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {invoice.lines?.map((line, idx) => (
                                    <tr key={line.id || idx} className="hover:bg-gray-800/50">
                                        <td className="px-6 py-4 text-sm text-gray-400">{idx + 1}</td>
                                        <td className="px-6 py-4 text-sm text-gray-200">
                                            <div className="font-medium text-white">{line.item?.name}</div>
                                            <div className="text-gray-500 text-xs">{line.item?.code}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-200 text-right">{line.quantity}</td>
                                        <td className="px-6 py-4 text-sm text-gray-200 text-right">{formatCurrency(line.unit_price || 0)}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-emerald-400 text-right">
                                            {formatCurrency((line.quantity || 0) * (line.unit_price || 0))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-[#252540]">
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-sm font-bold text-white text-right">Grand Total</td>
                                    <td className="px-6 py-4 text-sm font-bold text-emerald-400 text-right glow-green">
                                        {formatCurrency(invoice.total || 0)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    {invoice.status !== 'paid' && (
                        <Link
                            href={`/invoices/${invoice.id}/reconcile`}
                            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
                        >
                            Reconcile
                        </Link>
                    )}
                </div>
            </div>
        </Layout>
    );
}
