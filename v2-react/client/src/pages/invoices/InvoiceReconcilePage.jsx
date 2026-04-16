import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { getInvoices, reconcileInvoice } from '../../api/invoices';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import ConfirmDialog from '../../components/ConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { formatDate, formatCurrency } from '../../utils/formatters';

export default function InvoiceReconcilePage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const pagination = usePagination();

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInvoices({ page: pagination.page, limit: pagination.limit, status: 'pending' });
      setInvoices(res.data.data);
      pagination.updatePagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [pagination.page]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleReconcile = async () => {
    setActionLoading(true);
    try {
      await reconcileInvoice(selectedId);
      setConfirmOpen(false);
      setSuccess('Invoice reconciled successfully');
      fetchInvoices();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reconcile');
    }
    setActionLoading(false);
  };

  const columns = [
    {
      key: 'invoice_number',
      label: 'Invoice #',
      render: (row) => (
        <Link to={`/invoices/${row.id}`} className="font-medium text-primary-600 hover:text-primary-700">
          {row.invoice_number}
        </Link>
      ),
    },
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'paid_by', label: 'Paid By', render: (row) => row.paidByStore?.code || '-' },
    { key: 'invoice_date', label: 'Date', render: (row) => formatDate(row.invoice_date) },
    { key: 'total_amount', label: 'Amount', render: (row) => formatCurrency(row.total_amount) },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button
          onClick={() => { setSelectedId(row.id); setConfirmOpen(true); }}
          className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
        >
          <CheckCircleIcon className="h-4 w-4 mr-1" /> Reconcile
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reconcile Invoices</h1>
        <p className="mt-1 text-sm text-gray-500">Pending invoices awaiting reconciliation</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        pagination={{ page: pagination.page, totalPages: pagination.totalPages, total: pagination.total }}
        onPageChange={pagination.goToPage}
        emptyMessage="No pending invoices to reconcile"
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleReconcile}
        title="Reconcile Invoice"
        message="Confirm reconciliation of this invoice?"
        confirmText="Reconcile"
        confirmColor="primary"
        loading={actionLoading}
      />
    </div>
  );
}
