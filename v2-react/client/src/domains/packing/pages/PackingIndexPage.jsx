import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import api from '../../../api/axios';
import DataTable from '../../../components/DataTable';
import { useAuth } from '../../../hooks/useAuth';

const STATUS_COLORS = {
    draft: 'bg-gray-100 text-gray-700',
    packing: 'bg-yellow-100 text-yellow-700',
    packed: 'bg-green-100 text-green-700',
    shipped: 'bg-blue-100 text-blue-700',
};

export default function PackingIndexPage() {
    const { user, hasRole } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', type: '' });
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit, ...filters };
            const res = await api.get('/packing', { params });
            setJobs(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }, [page, filters]);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const columns = [
        {
            key: 'name',
            label: 'Job',
            render: (row) => (
                <div>
                    <Link to={`/packing/${row.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                        {row.name}
                    </Link>
                    {row.order && (
                        <div className="text-xs text-gray-500">Order: {row.order.order_number}</div>
                    )}
                </div>
            ),
        },
        { key: 'type', label: 'Type', render: (r) => <span className="capitalize">{r.type}</span> },
        {
            key: 'status',
            label: 'Status',
            render: (r) => (
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                    {r.status}
                </span>
            ),
        },
        {
            key: 'fromStore',
            label: 'Store',
            render: (r) => r.fromStore?.name || '—',
        },
        {
            key: 'progress',
            label: 'Progress',
            render: (r) => (
                <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${r.progress || 0}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{r.progress || 0}%</span>
                </div>
            ),
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (r) => new Date(r.created_at).toLocaleDateString(),
        },
    ];

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Packing Jobs</h1>
                <div className="flex gap-2">
                    {hasRole('admin') && (
                        <Link
                            to="/packing/templates"
                            className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                            Templates
                        </Link>
                    )}
                    {hasRole('admin') && (
                        <Link
                            to="/packing/new"
                            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
                        >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            New Job
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex gap-3 items-center bg-white rounded-lg border p-3">
                <select
                    value={filters.status}
                    onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
                    className="rounded-md border px-3 py-1.5 text-sm"
                >
                    <option value="">All Statuses</option>
                    {['draft', 'packing', 'packed', 'shipped'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <select
                    value={filters.type}
                    onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}
                    className="rounded-md border px-3 py-1.5 text-sm"
                >
                    <option value="">All Types</option>
                    {['shipment', 'transfer', 'event'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>

            <DataTable columns={columns} data={jobs} loading={loading} />
            {total > limit && (
                <div className="flex justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-3 py-1 rounded border text-sm disabled:opacity-50">Prev</button>
                    <span className="px-3 py-1 text-sm">Page {page}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={jobs.length < limit}
                        className="px-3 py-1 rounded border text-sm disabled:opacity-50">Next</button>
                </div>
            )}
        </div>
    );
}