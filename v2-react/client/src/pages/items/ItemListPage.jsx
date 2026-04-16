import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilSquareIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getItems } from '../../api/items';
import DataTable from '../../components/DataTable';
import { useAuth } from '../../hooks/useAuth';
import { usePagination } from '../../hooks/usePagination';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../utils/constants';

export default function ItemListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { hasRole } = useAuth();
  const pagination = usePagination();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getItems({ page: pagination.page, limit: pagination.limit, search, category: category || undefined });
      setItems(res.data.data);
      pagination.updatePagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [pagination.page, search, category]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const columns = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category' },
    { key: 'unit', label: 'Unit' },
    {
      key: 'price',
      label: 'Current Price',
      render: (row) => {
        const price = row.prices?.[0];
        return price ? formatCurrency(price.price) : '-';
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <Link to={`/items/${row.id}/edit`} className="text-primary-600 hover:text-primary-700">
          <PencilSquareIcon className="h-5 w-5" />
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Items</h1>
          <p className="mt-1 text-sm text-gray-500">Manage inventory items</p>
        </div>
        {hasRole('admin', 'b1', 'b2', 'b3') && (
          <Link to="/items/new" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-1.5" />
            Add Item
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); pagination.setPage(1); }}
            className="input-field pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); pagination.setPage(1); }}
          className="input-field w-auto"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        pagination={{ page: pagination.page, totalPages: pagination.totalPages, total: pagination.total }}
        onPageChange={pagination.goToPage}
      />
    </div>
  );
}
