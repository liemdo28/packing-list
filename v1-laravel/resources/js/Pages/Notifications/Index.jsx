import { Head, router } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Pagination from '@/Components/Pagination';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function NotificationsIndex({ notifications }) {
    const handleMarkAllRead = () => {
        router.post('/notifications/read-all');
    };

    const handleClick = (notification) => {
        if (!notification.read_at) {
            router.post(`/notifications/${notification.id}/read`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    if (notification.data?.order_id) {
                        router.visit(`/orders/${notification.data.order_id}`);
                    }
                },
            });
        } else if (notification.data?.order_id) {
            router.visit(`/orders/${notification.data.order_id}`);
        }
    };

    const hasUnread = notifications?.data?.some((n) => !n.read_at);

    return (
        <Layout>
            <Head title="Notifications" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Notifications</h1>
                    {hasUnread && (
                        <button
                            onClick={handleMarkAllRead}
                            className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                        >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Mark All Read
                        </button>
                    )}
                </div>

                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg divide-y divide-gray-700/50">
                    {notifications?.data?.length > 0 ? (
                        notifications.data.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleClick(notification)}
                                className={`p-4 cursor-pointer hover:bg-gray-800/50 transition-colors ${
                                    !notification.read_at ? 'bg-red-500/5 border-l-4 border-red-500' : ''
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`flex-shrink-0 mt-0.5 ${!notification.read_at ? 'text-red-400' : 'text-gray-500'}`}>
                                        <BellIcon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${!notification.read_at ? 'font-semibold text-white' : 'text-gray-300'}`}>
                                            {notification.data?.message || notification.data?.title || 'Notification'}
                                        </p>
                                        {notification.data?.body && (
                                            <p className="text-sm text-gray-400 mt-1">{notification.data.body}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                            {notification.created_at ? new Date(notification.created_at).toLocaleString() : ''}
                                        </p>
                                    </div>
                                    {!notification.read_at && (
                                        <div className="flex-shrink-0">
                                            <span className="inline-block h-2 w-2 rounded-full bg-red-500 shadow-neon-red" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-sm text-gray-500">
                            No notifications.
                        </div>
                    )}
                </div>

                {notifications?.links && <Pagination links={notifications.links} />}
            </div>
        </Layout>
    );
}
