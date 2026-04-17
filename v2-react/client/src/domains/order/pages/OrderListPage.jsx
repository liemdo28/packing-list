import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, EyeIcon } from '@heroicons/react/24/outline';
import { getOrders } from '../../../api/orders';
import DataTable from '../../../components/DataTable';
import Badge from '../../../components/Badge';
import { useAuth } from '../../../hooks/useAuth';
import { usePagination } from '../../../hooks/usePagination';
import { formatDateTime, formatCurrency } from '../../../utils/formatters';
import { STATUS_LABELS } from '../../../utils/constants';

export default function OrderListPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { user, hasRole } = useAuth();
  const pagination = usePagination();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setOrders(res.data.data);
      pagination.updatePagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [pagination.page, search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const canCreate = hasRole('admin', 'b1', 'b3');

  const columns = [
    {
      key: 'order_number',
      label: 'Order #',
      sortable: true,
      render: (row) => (
        <Link to={`/orders/${row.id}`} className="font-medium text-primary-600 hover:text-primary-700">
          {row.order_number}
        </Link>
      ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (row) => (
        <span className="text-sm">
          <span className="font-medium">{row.fromStore?.code}</span>
          <span className="mx-1.5 text-gray-400">&rarr;</span>
          <span className="font-medium">{row.toStore?.code}</span>
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: 'total_amount',
      label: 'Total',
      render: (row) => row.total_amount > 0 ? formatCurrency(row.total_amount) : '-',
    },
    {
      key: 'creator',
      label: 'Created By',
      render: (row) => row.creator?.full_name || '-',
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (row) => formatDateTime(row.created_at),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Link to={`/orders/${row.id}`} className="text-gray-400 hover:text-primary-600">
          <EyeIcon className="h-5 w-5" />
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">Manage transfer orders between stores</p>
        </div>
        {canCreate && (
          <Link to="/orders/new" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-1.5" />
            New Order
          </Link>
        )}
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search order number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); pagination.setPage(1); }}
            className="input-field pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); pagination.setPage(1); }}
          className="input-field w-auto"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        pagination={{ page: pagination.page, totalPages: pagination.totalPages, total: pagination.total }}
        onPageChange={pagination.goToPage}
      />
    </div>
  );
}