import { Head, Link } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Badge from '@/Components/Badge';
import Pagination from '@/Components/Pagination';
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

const roleBadgeColors = {
    admin: 'bg-red-500/20 text-red-400 border border-red-500/30',
    accountant: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    store: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
};

export default function UsersIndex({ users }) {
    return (
        <Layout>
            <Head title="Users" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Users</h1>
                    <Link
                        href="/users/create"
                        className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add User
                    </Link>
                </div>

                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Store</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {users?.data?.length > 0 ? (
                                    users.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleBadgeColors[user.role] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {user.store?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge status={user.active ? 'active' : 'inactive'} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Link href={`/users/${user.id}/edit`} className="text-blue-400 hover:text-blue-300 inline-flex items-center">
                                                    <PencilSquareIcon className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {users?.links && <Pagination links={users.links} />}
                </div>
            </div>
        </Layout>
    );
}
