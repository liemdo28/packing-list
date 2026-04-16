import { Head, Link, usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import StatCard from '@/Components/StatCard';
import Badge from '@/Components/Badge';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function Dashboard({ data = {}, recentOrders = [] }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const role = user?.role || 'store';

    const renderStats = () => {
        if (role === 'admin') {
            return (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total Orders" value={data.totalOrders ?? 0} color="red" />
                    <StatCard title="Pending Orders" value={data.pendingOrders ?? 0} color="yellow" />
                    <StatCard title="Completed Orders" value={data.completedOrders ?? 0} color="green" />
                    <StatCard title="This Month" value={data.thisMonthOrders ?? 0} color="blue" />
                </div>
            );
        }

        if (role === 'accountant') {
            return (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard title="Completed Orders" value={data.completedOrders ?? 0} color="green" />
                    <StatCard title="This Month Completed" value={data.thisMonthCompleted ?? 0} color="blue" />
                    <StatCard title="Unread Notifications" value={data.unreadNotifications ?? 0} color="purple" />
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Sent Orders" value={data.sentOrders ?? 0} color="red" />
                <StatCard title="Received Orders" value={data.receivedOrders ?? 0} color="blue" />
                <StatCard title="Pending Actions" value={data.pendingActions ?? 0} color="yellow" />
                <StatCard title="Unread Notifications" value={data.unreadNotifications ?? 0} color="purple" />
            </div>
        );
    };

    return (
        <Layout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    {role === 'store' && (
                        <Link
                            href="/orders/create"
                            className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition-colors"
                        >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            New Order
                        </Link>
                    )}
                </div>

                {renderStats()}

                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-700/50">
                        <h2 className="text-lg font-medium text-white">Recent Orders</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">From</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">To</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {recentOrders && recentOrders.length > 0 ? (
                                    recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                                {order.order_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {order.from_store?.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {order.to_store?.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge status={order.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Link href={`/orders/${order.id}`} className="text-blue-400 hover:text-blue-300">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                                            No recent orders.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
