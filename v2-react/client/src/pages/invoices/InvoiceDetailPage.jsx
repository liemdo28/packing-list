import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { getInvoice, reconcileInvoice } from '../../api/invoices';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatters';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInvoice = () => {
    setLoading(true);
    getInvoice(id)
      .then((res) => setInvoice(res.data.data))
      .catch(() => setError('Failed to load invoice'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInvoice(); }, [id]);

  const handleReconcile = async () => {
    setActionLoading(true);
    try {
      await reconcileInvoice(id);
      setReconcileOpen(false);
      setSuccess('Invoice reconciled successfully');
      fetchInvoice();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reconcile');
    }
    setActionLoading(false);
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;
  if (!invoice) return <Alert type="error" message="Invoice not found" />;

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/invoices" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Invoices
      </Link>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
            <p className="mt-1 text-sm text-gray-500">{invoice.supplier_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge status={invoice.status} type="invoice" className="text-sm px-3 py-1" />
            {invoice.status === 'pending' && hasRole('admin', 'accountant') && (
              <button onClick={() => setReconcileOpen(true)} className="btn-success text-sm">Reconcile</button>
            )}
            {invoice.status === 'pending' && (
              <Link to={`/invoices/${id}/edit`} className="btn-secondary text-sm">
                <PencilSquareIcon className="h-4 w-4 mr-1" /> Edit
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Line Items</h2>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.lines?.map((line) => (
                <tr key={line.id}>
                  <td className="px-4 py-2">
                    {line.description}
                    {line.item && <span className="text-xs text-gray-400 ml-1">({line.item.code})</span>}
                  </td>
                  <td className="px-4 py-2 text-right">{line.quantity}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(line.unit_price)}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(line.total_price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right font-semibold">Total</td>
                <td className="px-4 py-2 text-right font-bold text-primary-700">{formatCurrency(invoice.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Details</h2>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-gray-500">Paid By</dt><dd className="font-medium">{invoice.paidByStore?.code} - {invoice.paidByStore?.name}</dd></div>
            {invoice.onBehalfOfStore && <div><dt className="text-gray-500">On Behalf Of</dt><dd className="font-medium">{invoice.onBehalfOfStore.code} - {invoice.onBehalfOfStore.name}</dd></div>}
            <div><dt className="text-gray-500">Invoice Date</dt><dd>{formatDate(invoice.invoice_date)}</dd></div>
            {invoice.due_date && <div><dt className="text-gray-500">Due Date</dt><dd>{formatDate(invoice.due_date)}</dd></div>}
            <div><dt className="text-gray-500">Created By</dt><dd>{invoice.creator?.full_name}</dd></div>
            <div><dt className="text-gray-500">Created At</dt><dd>{formatDateTime(invoice.created_at)}</dd></div>
            {invoice.reconciler && <div><dt className="text-gray-500">Reconciled By</dt><dd>{invoice.reconciler.full_name}</dd></div>}
            {invoice.reconciled_at && <div><dt className="text-gray-500">Reconciled At</dt><dd>{formatDateTime(invoice.reconciled_at)}</dd></div>}
            {invoice.notes && <div><dt className="text-gray-500">Notes</dt><dd>{invoice.notes}</dd></div>}
          </dl>
        </div>
      </div>

      <ConfirmDialog
        open={reconcileOpen}
        onClose={() => setReconcileOpen(false)}
        onConfirm={handleReconcile}
        title="Reconcile Invoice"
        message="Are you sure you want to mark this invoice as reconciled? This action cannot be undone."
        confirmText="Reconcile"
        confirmColor="primary"
        loading={actionLoading}
      />
    </div>
  );
}
