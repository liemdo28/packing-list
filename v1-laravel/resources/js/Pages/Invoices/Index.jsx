import { Head, Link } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Badge from '@/Components/Badge';
import Pagination from '@/Components/Pagination';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function InvoicesIndex({ invoices }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <Layout>
            <Head title="Invoices" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Invoices</h1>
                    <Link
                        href="/invoices/create"
                        className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Create Invoice
                    </Link>
                </div>

                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Invoice #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">From</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">To</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Period</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {invoices?.data?.length > 0 ? (
                                    invoices.data.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-gray-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{invoice.invoice_number}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{invoice.from_store?.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{invoice.to_store?.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{invoice.period_month}/{invoice.period_year}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-400 text-right">{formatCurrency(invoice.total || 0)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><Badge status={invoice.status} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : ''}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                <Link href={`/invoices/${invoice.id}`} className="text-blue-400 hover:text-blue-300 inline-flex items-center">
                                                    <EyeIcon className="h-4 w-4 mr-1" />
                                                    View
                                                </Link>
                                                {invoice.status !== 'paid' && (
                                                    <Link href={`/invoices/${invoice.id}/reconcile`} className="text-emerald-400 hover:text-emerald-300">
                                                        Reconcile
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">No invoices found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {invoices?.links && <Pagination links={invoices.links} />}
                </div>
            </div>
        </Layout>
    );
}
