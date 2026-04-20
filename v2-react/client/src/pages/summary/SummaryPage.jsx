import { useState, useEffect } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { getMonthlySummary, exportExcel, exportPdf } from '../../api/summary';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { formatCurrency } from '../../utils/formatters';
import { STORE_PAIRS } from '../../utils/constants';
import { downloadBlob } from '../../utils/helpers';

export default function SummaryPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMonthlySummary({ year, month })
      .then((res) => setSummary(res.data.data))
      .catch(() => setError('Failed to load summary'))
      .finally(() => setLoading(false));
  }, [year, month]);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const params = { year, month };
      if (format === 'excel') {
        const res = await exportExcel(params);
        downloadBlob(res.data, `summary-${year}-${month}.xlsx`);
      } else {
        const res = await exportPdf(params);
        downloadBlob(res.data, `summary-${year}-${month}.pdf`);
      }
    } catch (err) {
      setError('Export failed');
    }
    setExporting(false);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfer Summary</h1>
          <p className="mt-1 text-sm text-gray-500">Monthly reconciliation overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('excel')} disabled={exporting} className="btn-secondary text-sm">
            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" /> Excel
          </button>
          <button onClick={() => handleExport('pdf')} disabled={exporting} className="btn-secondary text-sm">
            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" /> PDF
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Filters */}
      <div className="mb-6 flex gap-3">
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="input-field w-auto">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))} className="input-field w-auto">
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner className="py-12" /> : (
        <div className="space-y-6">
          {/* Grand Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{summary?.grand_total_orders || 0}</p>
            </div>
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-3xl font-bold text-primary-700 mt-1">{formatCurrency(summary?.grand_total || 0)}</p>
            </div>
          </div>

          {/* Pair Summaries */}
          <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Summary by Store Pair</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Route</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">Orders</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">Items</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary?.pairs?.length > 0 ? summary.pairs.map((pair, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium">
                        {pair.from_store} &rarr; {pair.to_store}
                      </td>
                      <td className="px-6 py-3 text-sm text-right">{pair.total_orders}</td>
                      <td className="px-6 py-3 text-sm text-right">{pair.total_items}</td>
                      <td className="px-6 py-3 text-sm text-right font-medium">{formatCurrency(pair.total_amount)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                        No completed orders for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
