import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notifications';
import { usePagination } from '../../hooks/usePagination';
import { useNotifications } from '../../hooks/useNotifications';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDateTime } from '../../utils/formatters';

export default function NotificationListPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const pagination = usePagination();
  const { refetch } = useNotifications();
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ page: pagination.page, limit: pagination.limit });
      setNotifications(res.data.data);
      pagination.updatePagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [pagination.page]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleRead = async (notif) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
      refetch();
      fetchNotifications();
    }
    if (notif.reference_type === 'order' && notif.reference_id) {
      navigate(`/orders/${notif.reference_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    refetch();
    fetchNotifications();
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">Stay updated on order activities</p>
        </div>
        <button onClick={handleMarkAllRead} className="btn-secondary text-sm">
          <CheckIcon className="h-4 w-4 mr-1.5" />
          Mark All Read
        </button>
      </div>

      {loading ? <LoadingSpinner className="py-12" /> : (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <BellIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleRead(notif)}
                className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors ${
                  !notif.is_read ? 'bg-primary-50/40' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {!notif.is_read && (
                    <span className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary-600" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notif.title}
                      </p>
                      <span className={`text-xs ml-2 flex-shrink-0 rounded-full px-2 py-0.5 ${
                        notif.type === 'order' ? 'bg-blue-100 text-blue-700' :
                        notif.type === 'invoice' ? 'bg-green-100 text-green-700' :
                        notif.type === 'alert' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {notif.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.created_at)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
          {pagination.totalPages > 1 && (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={pagination.goToPage} />
          )}
        </div>
      )}
    </div>
  );
}
