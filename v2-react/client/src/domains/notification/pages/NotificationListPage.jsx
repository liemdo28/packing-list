import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, CheckIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { getNotifications, markAsRead, markAllAsRead } from '../../../api/notifications';
import { usePagination } from '../../../hooks/usePagination';
import { useNotifications } from '../../../hooks/useNotifications';
import Pagination from '../../../components/Pagination';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { formatDateTime } from '../../../utils/formatters';

export default function NotificationListPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', isRead: '', severity: '' });
  const [showFilters, setShowFilters] = useState(false);
  const pagination = usePagination();
  const { refresh } = useNotifications();
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...filters };
      const res = await getNotifications(params);
      setNotifications(res.data.data);
      pagination.updatePagination(res.data.pagination);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [pagination.page, filters]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleRead = async (notif) => {
    if (!notif.is_read) { await markAsRead(notif.id); refresh(); fetchNotifications(); }
    if (notif.order_id) navigate(`/orders/${notif.order_id}`);
    else if (notif.reference_type === 'order' && notif.reference_id) navigate(`/orders/${notif.reference_id}`);
  };

  const handleMarkAllRead = async () => { await markAllAsRead(); refresh(); fetchNotifications(); };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    pagination.goToPage(1);
  };

  const clearFilters = () => { setFilters({ type: '', isRead: '', severity: '' }); pagination.goToPage(1); };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'order': return 'bg-blue-100 text-blue-700';
      case 'shipment': return 'bg-purple-100 text-purple-700';
      case 'discrepancy': return 'bg-red-100 text-red-700';
      case 'alert': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Notifications</h1><p className="mt-1 text-sm text-gray-500">Stay updated on order activities</p></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary text-sm"><FunnelIcon className="h-4 w-4 mr-1.5" />Filters</button>
          <button onClick={handleMarkAllRead} className="btn-secondary text-sm"><CheckIcon className="h-4 w-4 mr-1.5" />Mark All Read</button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-white rounded-xl shadow-sm ring-1 ring-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <option value="">All Types</option>
                <option value="order">Order</option>
                <option value="shipment">Shipment</option>
                <option value="discrepancy">Discrepancy</option>
                <option value="alert">Alert</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={filters.isRead} onChange={(e) => handleFilterChange('isRead', e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <option value="">All</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select value={filters.severity} onChange={(e) => handleFilterChange('severity', e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          {(filters.type || filters.isRead || filters.severity) && <div className="mt-3 flex justify-end"><button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700">Clear filters</button></div>}
        </div>
      )}

      {loading ? <LoadingSpinner className="py-12" /> : (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <div className="py-12 text-center"><BellIcon className="mx-auto h-12 w-12 text-gray-300" /><p className="mt-3 text-sm text-gray-500">No notifications found</p></div>
          ) : (
            notifications.map((notif) => (
              <button key={notif.id} onClick={() => handleRead(notif)} className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-primary-50/40' : ''}`}>
                <div className="flex items-start gap-3">
                  {!notif.is_read && <span className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary-600" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{notif.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {notif.severity && <span className={`text-xs rounded-full px-2 py-0.5 border ${getSeverityBadge(notif.severity)}`}>{notif.severity}</span>}
                        {notif.type && <span className={`text-xs rounded-full px-2 py-0.5 ${getTypeBadge(notif.type)}`}>{notif.type}</span>}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      {notif.source_store_name && <span>From: {notif.source_store_name}</span>}
                      {notif.order_number && <span>Order: {notif.order_number}</span>}
                      <span>{formatDateTime(notif.created_at)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
          {pagination.totalPages > 1 && <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={pagination.goToPage} />}
        </div>
      )}
    </div>
  );
}