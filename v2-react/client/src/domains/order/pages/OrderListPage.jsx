import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, EyeIcon } from '@heroicons/react/24/outline';
import { getOrders } from '../../../api/orders';
import DataTable from '../../../components/DataTable';
import Badge from '../../../components/Badge';
import EmptyState from '../../../components/EmptyState';
import { useAuth } from '../../../hooks/useAuth';
import { usePagination } from '../../../hooks/usePagination';
import { formatDateTime, formatCurrency } from '../../../utils/formatters';
import { getOrderListGroups, getOrderRowInsights } from '../../../utils/workflow';

export default function OrderListPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, hasRole } = useAuth();
  const pagination = usePagination();

  const groups = getOrderListGroups(orders, user);
  const currentTab = searchParams.get('tab') || 'needs-my-action';
  const activeGroup = groups.find((group) => group.key === currentTab) || groups[0];

  useEffect(() => {
    setLoading(true);
    getOrders({
      page: pagination.page,
      limit: 100,
      search: search || undefined,
      status: statusFilter || undefined,
    })
      .then((res) => {
        setOrders(res.data.data);
        pagination.updatePagination(res.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pagination.page, search, statusFilter]);

  const canCreate = hasRole('admin', 'b1', 'b3');
  const filteredOrders = orders.filter(activeGroup.filter);

  const columns = [
    {
      key: 'order_number',
      label: 'Order',
      sortable: true,
      render: (row) => (
        <div>
          <Link to={`/orders/${row.id}`} className="font-medium text-primary-600 hover:text-primary-700">
            {row.order_number}
          </Link>
          <p className="mt-1 text-xs text-gray-400">{row.creator?.full_name || 'Unknown owner'}</p>
        </div>
      ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (row) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">{row.fromStore?.code} &rarr; {row.toStore?.code}</p>
          <p className="mt-1 text-xs text-gray-500">{row.fromStore?.name} to {row.toStore?.name}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Current Step',
      render: (row) => {
        const insight = getOrderRowInsights(row, user);
        return (
          <div>
            <Badge status={row.status} />
            <p className="mt-1 text-xs text-gray-500">{insight.nextAction}</p>
          </div>
        );
      },
    },
    {
      key: 'updated_at',
      label: 'Last Update',
      sortable: true,
      render: (row) => formatDateTime(row.updated_at || row.created_at),
    },
    {
      key: 'total_amount',
      label: 'Value',
      render: (row) => row.total_amount > 0 ? formatCurrency(row.total_amount) : '-',
    },
    {
      key: 'risk',
      label: 'Risk',
      render: (row) => {
        const insight = getOrderRowInsights(row, user);
        return insight.riskLabel ? (
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">{insight.riskLabel}</span>
        ) : (
          <span className="text-xs text-gray-400">Clear</span>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Link to={`/orders/${row.id}`} className="inline-flex text-gray-400 hover:text-primary-600">
          <EyeIcon className="h-5 w-5" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organize work around what needs your action now, not one giant raw list.
          </p>
        </div>
        {canCreate && (
          <Link to="/orders/new" className="btn-primary">
            <PlusIcon className="mr-1.5 h-5 w-5" />
            New Order
          </Link>
        )}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search order number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                pagination.setPage(1);
              }}
              className="input-field pl-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              pagination.setPage(1);
            }}
            className="input-field w-auto"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="preparing">Preparing</option>
            <option value="shipping">Shipping</option>
            <option value="received">Received</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {groups.map((group) => (
            <button
              key={group.key}
              type="button"
              onClick={() => setSearchParams({ tab: group.key })}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeGroup.key === group.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">{activeGroup.label}</p>
          <p className="mt-1 text-sm text-gray-500">{activeGroup.helper}</p>
        </div>

        {!loading && filteredOrders.length === 0 ? (
          <EmptyState
            title={activeGroup.empty}
            description={
              canCreate && activeGroup.key === 'drafts'
                ? 'Create a new order to request items from another store, then come back here to submit it.'
                : 'Adjust the filter or come back later when new work arrives.'
            }
            ctaLabel={canCreate && ['needs-my-action', 'drafts'].includes(activeGroup.key) ? 'Create order' : null}
            ctaTo={canCreate && ['needs-my-action', 'drafts'].includes(activeGroup.key) ? '/orders/new' : null}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredOrders}
            loading={loading}
            pagination={{ page: pagination.page, totalPages: pagination.totalPages, total: filteredOrders.length }}
            onPageChange={pagination.goToPage}
            emptyMessage={activeGroup.empty}
          />
        )}
      </section>
    </div>
  );
}
