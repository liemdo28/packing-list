import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Pagination from '@/Components/Pagination';
import { FunnelIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function AuditLogsIndex({ logs, tables = [], users = [] }) {
    const [filters, setFilters] = useState({
        table: new URL(window.location).searchParams.get('table') || '',
        action: new URL(window.location).searchParams.get('action') || '',
        user_id: new URL(window.location).searchParams.get('user_id') || '',
    });

    const [expandedRow, setExpandedRow] = useState(null);

    const handleFilter = (e) => {
        e.preventDefault();
        router.visit('/audit-logs', {
            data: filters,
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setFilters({ table: '', action: '', user_id: '' });
        router.visit('/audit-logs', { replace: true });
    };

    const toggleExpand = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const actionColors = {
        created: 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30',
        updated: 'text-blue-400 bg-blue-500/20 border border-blue-500/30',
        deleted: 'text-red-400 bg-red-500/20 border border-red-500/30',
    };

    return (
        <Layout>
            <Head title="Audit Logs" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white">Audit Logs</h1>

                {/* Filters */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-4">
                    <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Table</label>
                            <select value={filters.table} onChange={(e) => setFilters({ ...filters, table: e.target.value })} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm">
                                <option value="">All Tables</option>
                                {tables.map((t) => (<option key={t} value={t}>{t}</option>))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Action</label>
                            <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm">
                                <option value="">All Actions</option>
                                <option value="created">Created</option>
                                <option value="updated">Updated</option>
                                <option value="deleted">Deleted</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-1">User</label>
                            <select value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm">
                                <option value="">All Users</option>
                                {users.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500">
                                <FunnelIcon className="h-4 w-4 mr-1" />
                                Filter
                            </button>
                            <button type="button" onClick={handleReset} className="inline-flex items-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-200 shadow-sm hover:bg-gray-600">
                                Reset
                            </button>
                        </div>
                    </form>
                </div>

                {/* Logs table */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Table</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Record</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Details</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                                {logs?.data?.length > 0 ? (
                                    logs.data.map((log) => (
                                        <>
                                            <tr key={log.id} className="hover:bg-gray-800/50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                    {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                                                    {log.user?.name || 'System'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${actionColors[log.action] || 'text-gray-300 bg-gray-500/20 border border-gray-500/30'}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{log.table_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">#{log.record_id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {log.changes && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpand(log.id)}
                                                            className="text-blue-400 hover:text-blue-300 inline-flex items-center"
                                                        >
                                                            {expandedRow === log.id ? (
                                                                <>
                                                                    <ChevronUpIcon className="h-4 w-4 mr-1" />
                                                                    Hide
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDownIcon className="h-4 w-4 mr-1" />
                                                                    Show
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            {expandedRow === log.id && log.changes && (
                                                <tr key={`${log.id}-details`}>
                                                    <td colSpan={6} className="px-6 py-4 bg-[#252540]">
                                                        <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto bg-gray-900 rounded p-3 border border-gray-700/50">
                                                            {typeof log.changes === 'string'
                                                                ? log.changes
                                                                : JSON.stringify(log.changes, null, 2)}
                                                        </pre>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                                            No audit logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {logs?.links && <Pagination links={logs.links} />}
                </div>
            </div>
        </Layout>
    );
}
