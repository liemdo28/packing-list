import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { getPriceHistory } from '../../api/prices';
import DataTable from '../../components/DataTable';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function PriceHistoryPage() {
  const { itemId } = useParams();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPriceHistory(itemId)
      .then((res) => setPrices(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [itemId]);

  const itemName = prices[0]?.item ? `${prices[0].item.code} - ${prices[0].item.name}` : `Item #${itemId}`;

  const columns = [
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
    { key: 'creator', label: 'Set By', render: (row) => row.creator?.full_name || '-' },
    { key: 'created_at', label: 'Created', render: (row) => formatDate(row.created_at) },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link to="/prices" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Prices
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Price History</h1>
        <p className="mt-1 text-sm text-gray-500">{itemName}</p>
      </div>
      <DataTable columns={columns} data={prices} loading={loading} />
    </div>
  );
}
