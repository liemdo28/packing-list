import { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getAuditLogs } from '../../api/auditLogs';
import DataTable from '../../components/DataTable';
import { usePagination } from '../../hooks/usePagination';
import { formatDateTime } from '../../utils/formatters';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const pagination = usePagination();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAuditLogs({
        page: pagination.page,
        limit: pagination.limit,
        entity_type: entityType || undefined,
        action: action || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      setLogs(res.data.data);
      pagination.updatePagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [pagination.page, entityType, action, fromDate, toDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const columns = [
    { key: 'created_at', label: 'Date', render: (row) => formatDateTime(row.created_at) },
    { key: 'user', label: 'User', render: (row) => row.user?.full_name || 'System' },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 capitalize">
          {row.action}
        </span>
      ),
    },
    {
      key: 'entity_type',
      label: 'Entity',
      render: (row) => (
        <span className="capitalize">{row.entity_type}</span>
      ),
    },
    { key: 'entity_id', label: 'Entity ID' },
    {
      key: 'changes',
      label: 'Details',
      render: (row) => {
        if (!row.new_values) return '-';
        const keys = Object.keys(row.new_values).filter(k => !['password', 'updated_at', 'created_at'].includes(k));
        return (
          <span className="text-xs text-gray-500 max-w-xs truncate block">
            {keys.slice(0, 3).join(', ')}{keys.length > 3 ? '...' : ''}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500">Track all system changes</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select value={entityType} onChange={(e) => { setEntityType(e.target.value); pagination.setPage(1); }} className="input-field w-auto">
          <option value="">All Entities</option>
          <option value="order">Order</option>
          <option value="item">Item</option>
          <option value="store">Store</option>
          <option value="user">User</option>
          <option value="price">Price</option>
          <option value="invoice">Invoice</option>
        </select>
        <select value={action} onChange={(e) => { setAction(e.target.value); pagination.setPage(1); }} className="input-field w-auto">
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="submit">Submit</option>
          <option value="ship">Ship</option>
          <option value="complete">Complete</option>
          <option value="cancel">Cancel</option>
        </select>
        <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); pagination.setPage(1); }} className="input-field w-auto" placeholder="From" />
        <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); pagination.setPage(1); }} className="input-field w-auto" placeholder="To" />
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        pagination={{ page: pagination.page, totalPages: pagination.totalPages, total: pagination.total }}
        onPageChange={pagination.goToPage}
        emptyMessage="No audit logs found"
      />
    </div>
  );
}
