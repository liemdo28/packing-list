import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { getInvoices } from '../../../api/invoices';
import DataTable from '../../../components/DataTable';
import Badge from '../../../components/Badge';
import { useAuth } from '../../../hooks/useAuth';
import { usePagination } from '../../../hooks/usePagination';
import { formatDate, formatCurrency } from '../../../utils/formatters';

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { hasRole } = useAuth();
  const pagination = usePagination();

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInvoices({ page: pagination.page, limit: pagination.limit, status: statusFilter || undefined });
      setInvoices(res.data.data);
      pagination.updatePagination(res.data.pagination);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [pagination.page, statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const columns = [
    { key: 'invoice_number', label: 'Invoice #', render: (row) => (
      <Link to={`/invoices/${row.id}`} className="font-medium text-primary-600 hover:text-primary-700">{row.invoice_number}</Link>
    )},
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'paid_by', label: 'Paid By', render: (row) => row.paidByStore?.code || '-' },
    { key: 'on_behalf_of', label: 'On Behalf Of', render: (row) => row.onBehalfOfStore?.code || '-' },
    { key: 'invoice_date', label: 'Date', render: (row) => formatDate(row.invoice_date) },
    { key: 'total_amount', label: 'Amount', render: (row) => formatCurrency(row.total_amount) },
    { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} type="invoice" /> },
    { key: 'actions', label: '', render: (row) => (
      <Link to={`/invoices/${row.id}`} className="text-gray-400 hover:text-primary-600"><EyeIcon className="h-5 w-5" /></Link>
    )},
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">Manage supplier invoices and reconciliation</p>
        </div>
        {hasRole('admin', 'accountant', 'b2') && (
          <Link to="/invoices/new" className="btn-primary"><PlusIcon className="h-5 w-5 mr-1.5" /> New Invoice</Link>
        )}
      </div>
      <div className="mb-4">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); pagination.setPage(1); }} className="input-field w-auto">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="reconciled">Reconciled</option>
          <option value="disputed">Disputed</option>
        </select>
      </div>
      <DataTable columns={columns} data={invoices} loading={loading}
        pagination={{ page: pagination.page, totalPages: pagination.totalPages, total: pagination.total }}
        onPageChange={pagination.goToPage} />
    </div>
  );
}