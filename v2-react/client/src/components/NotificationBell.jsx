import { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { getNotifications, markAsRead } from '../api/notifications';
import { formatDateTime } from '../utils/formatters';

export default function NotificationBell() {
  const { unreadCount, refetch } = useNotifications();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = async () => {
    if (!open) {
      setLoading(true);
      try {
        const res = await getNotifications({ limit: 5 });
        setItems(res.data.data);
      } catch (err) {
        // ignore
      }
      setLoading(false);
    }
    setOpen(!open);
  };

  const handleClick = async (notif) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
      refetch();
    }
    setOpen(false);
    if (notif.reference_type === 'order' && notif.reference_id) {
      navigate(`/orders/${notif.reference_id}`);
    } else {
      navigate('/notifications');
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className="relative rounded-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl bg-white shadow-lg ring-1 ring-gray-200">
          <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-primary-600">{unreadCount} unread</span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading...</div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No notifications</div>
            ) : (
              items.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition-colors ${
                    !notif.is_read ? 'bg-primary-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notif.is_read && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-600" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          <button
            onClick={() => { setOpen(false); navigate('/notifications'); }}
            className="block w-full border-t border-gray-100 px-4 py-3 text-center text-sm font-medium text-primary-600 hover:bg-gray-50"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
