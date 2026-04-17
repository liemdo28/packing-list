import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilSquareIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getUsers } from '../../../api/users';
import DataTable from '../../../components/DataTable';
import { usePagination } from '../../../hooks/usePagination';
import { ROLE_LABELS } from '../../../utils/constants';
import { formatDateTime } from '../../../utils/formatters';

export default function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const pagination = usePagination();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({ page: pagination.page, limit: pagination.limit, search: search || undefined, role: roleFilter || undefined });
      setUsers(res.data.data);
      pagination.updatePagination(res.data.pagination);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [pagination.page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const columns = [
    { key: 'username', label: 'Username', sortable: true },
    { key: 'full_name', label: 'Full Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (row) => <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-700">{ROLE_LABELS[row.role] || row.role}</span> },
    { key: 'store', label: 'Store', render: (row) => row.store?.code || '-' },
    { key: 'is_active', label: 'Status', render: (row) => <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{row.is_active ? 'Active' : 'Inactive'}</span> },
    { key: 'last_login', label: 'Last Login', render: (row) => formatDateTime(row.last_login) },
    { key: 'actions', label: '', render: (row) => <Link to={`/users/${row.id}/edit`} className="text-primary-600 hover:text-primary-700"><PencilSquareIcon className="h-5 w-5" /></Link> },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Users</h1><p className="mt-1 text-sm text-gray-500">Manage system users</p></div>
        <Link to="/users/new" className="btn-primary"><PlusIcon className="h-5 w-5 mr-1.5" /> Add User</Link>
      </div>
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); pagination.setPage(1); }} className="input-field pl-9" />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); pagination.setPage(1); }} className="input-field w-auto">
          <option value="">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={users} loading={loading}
        pagination={{ page: pagination.page, totalPages: pagination.totalPages, total: pagination.total }}
        onPageChange={pagination.goToPage} />
    </div>
  );
}