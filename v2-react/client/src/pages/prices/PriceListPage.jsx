import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, ClockIcon } from '@heroicons/react/24/outline';
import { getPrices } from '../../api/prices';
import DataTable from '../../components/DataTable';
import { usePagination } from '../../hooks/usePagination';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function PriceListPage() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const pagination = usePagination();

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPrices({ page: pagination.page, limit: pagination.limit, active: 'true' });
      setPrices(res.data.data);
      pagination.updatePagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [pagination.page]);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  const columns = [
    { key: 'item_code', label: 'Item Code', render: (row) => row.item?.code },
    { key: 'item_name', label: 'Item Name', render: (row) => row.item?.name },
    { key: 'price', label: 'Price', render: (row) => formatCurrency(row.price) },
    { key: 'effective_date', label: 'Effective Date', render: (row) => formatDate(row.effective_date) },
    { key: 'end_date', label: 'End Date', render: (row) => formatDate(row.end_date) },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {row.is_active ? 'Active' : 'Expired'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Link to={`/prices/history/${row.item_id}`} className="text-primary-600 hover:text-primary-700" title="View history">
          <ClockIcon className="h-5 w-5" />
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prices</h1>
          <p className="mt-1 text-sm text-gray-500">Manage item pricing</p>
        </div>
        <Link to="/prices/new" className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-1.5" />
          Set New Price
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={prices}
        loading={loading}
        pagination={{ page: pagination.page, totalPages: pagination.totalPages, total: pagination.total }}
        onPageChange={pagination.goToPage}
      />
    </div>
  );
}
