import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Pagination from './Pagination';
import LoadingSpinner from './LoadingSpinner';

export default function DataTable({ columns, data, loading, pagination, onPageChange, onSort, sortBy, sortDir, emptyMessage = 'No data found' }) {
  const handleSort = (key) => {
    if (!onSort) return;
    const newDir = sortBy === key && sortDir === 'asc' ? 'desc' : 'asc';
    onSort(key, newDir);
  };

  if (loading) {
    return <LoadingSpinner className="py-12" />;
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${col.sortable ? 'cursor-pointer hover:text-gray-700 select-none' : ''} ${col.className || ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortBy === col.key && (
                      sortDir === 'asc' ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data && data.length > 0 ? (
              data.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={`whitespace-nowrap px-4 py-3 text-sm text-gray-700 ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
