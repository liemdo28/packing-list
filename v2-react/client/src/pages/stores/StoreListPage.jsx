import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { getStores } from '../../api/stores';
import DataTable from '../../components/DataTable';
import { useAuth } from '../../hooks/useAuth';

export default function StoreListPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAuth();

  useEffect(() => {
    getStores()
      .then((res) => setStores(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' },
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
    ...(hasRole('admin') ? [{
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <Link to={`/stores/${row.id}/edit`} className="text-primary-600 hover:text-primary-700">
          <PencilSquareIcon className="h-5 w-5" />
        </Link>
      ),
    }] : []),
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
          <p className="mt-1 text-sm text-gray-500">Manage store branches</p>
        </div>
        {hasRole('admin') && (
          <Link to="/stores/new" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-1.5" />
            Add Store
          </Link>
        )}
      </div>
      <DataTable columns={columns} data={stores} loading={loading} />
    </div>
  );
}
