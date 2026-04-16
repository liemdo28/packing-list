import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CubeIcon,
  BuildingStorefrontIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { getDashboardStats } from '../api/dashboard';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDateTime, formatCurrency } from '../utils/formatters';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.full_name}. Here is an overview of your transfers.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Orders" value={stats?.totalOrders || 0} icon={ClipboardDocumentListIcon} color="primary" />
        <StatCard title="Pending Orders" value={stats?.pendingOrders || 0} icon={ClockIcon} color="yellow" />
        <StatCard title="Completed This Month" value={stats?.completedThisMonth || 0} icon={CheckCircleIcon} color="green" />
        <StatCard title="Monthly Total" value={formatCurrency(stats?.monthlyTotal || 0)} icon={CurrencyDollarIcon} color="purple" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <StatCard title="Active Items" value={stats?.activeItems || 0} icon={CubeIcon} color="indigo" />
        <StatCard title="Active Stores" value={stats?.activeStores || 0} icon={BuildingStorefrontIcon} color="green" />
        <StatCard title="Unread Notifications" value={stats?.unreadNotifications || 0} icon={BellIcon} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats?.recentOrders?.length > 0 ? stats.recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.order_number}</p>
                  <p className="text-xs text-gray-500">
                    {order.fromStore?.code} &rarr; {order.toStore?.code}
                    <span className="mx-1.5">&middot;</span>
                    {formatDateTime(order.created_at)}
                  </p>
                </div>
                <Badge status={order.status} />
              </Link>
            )) : (
              <p className="px-6 py-8 text-center text-sm text-gray-500">No recent orders</p>
            )}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">Orders by Status</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats?.statusCounts && Object.entries(stats.statusCounts).map(([status, count]) => {
                const total = stats.totalOrders || 1;
                const pct = Math.round((count / total) * 100);
                const colors = {
                  draft: 'bg-gray-400',
                  submitted: 'bg-blue-500',
                  preparing: 'bg-yellow-500',
                  shipped: 'bg-purple-500',
                  received: 'bg-indigo-500',
                  completed: 'bg-green-500',
                  cancelled: 'bg-red-500',
                };
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 capitalize">{status}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full ${colors[status] || 'bg-gray-400'} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
