import { useState, useEffect, useCallback } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import {
  getAdminPricingSyncStatus,
  getAdminPricingSyncHistory,
  triggerPricingSync,
  getAdminMissingPrices,
  getAdminPriceAudit,
} from '../../api/prices';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';

function StatusBadge({ status }) {
  const map = {
    success: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
    failed:  'bg-red-100 text-red-700',
    running: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

function StatCard({ icon: Icon, iconBg, label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <div className="flex items-start gap-4">
        <div className={`rounded-2xl p-3 ${iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function PricingDashboardPage() {
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncHistory, setSyncHistory] = useState([]);
  const [missingPrices, setMissingPrices] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  const load = useCallback(async () => {
    try {
      const [statusRes, historyRes, missingRes, auditRes] = await Promise.all([
        getAdminPricingSyncStatus(),
        getAdminPricingSyncHistory(10),
        getAdminMissingPrices(),
        getAdminPriceAudit({ limit: 30 }),
      ]);
      setSyncStatus(statusRes.data.data);
      setSyncHistory(historyRes.data.data || []);
      setMissingPrices(missingRes.data.data || []);
      setAuditLog(auditRes.data.data || []);
    } catch (err) {
      console.error('Pricing dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const res = await triggerPricingSync();
      setSyncResult(res.data.data);
      await load();
    } catch (err) {
      setSyncError(err.response?.data?.error || err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  const lastSync = syncStatus?.lastSync;
  const missingCount = syncStatus?.missingCount ?? missingPrices.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing Admin</h1>
          <p className="mt-1 text-sm text-gray-500">
            Google Sheets sync status, missing prices, and price change history.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync from Google Sheets'}
        </button>
      </div>

      {/* Sync result flash */}
      {syncResult && (
        <div className={`rounded-2xl px-5 py-4 ring-1 ${syncResult.status === 'success' ? 'bg-green-50 ring-green-200' : syncResult.status === 'partial' ? 'bg-yellow-50 ring-yellow-200' : 'bg-red-50 ring-red-200'}`}>
          <div className="flex items-start gap-3">
            {syncResult.status === 'success'
              ? <CheckCircleIcon className="mt-0.5 h-5 w-5 text-green-600" />
              : <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-yellow-600" />}
            <div className="text-sm">
              <p className="font-semibold">
                Sync {syncResult.status} — {syncResult.itemsSynced} synced, {syncResult.itemsUpdated} updated, {syncResult.itemsFailed} failed, {syncResult.itemsMissing} missing
              </p>
              {syncResult.errors?.length > 0 && (
                <ul className="mt-2 list-disc pl-4 text-red-700">
                  {syncResult.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
              {syncResult.warnings?.length > 0 && (
                <p className="mt-1 text-gray-600">{syncResult.warnings.length} items not found in DB (see missing prices below)</p>
              )}
            </div>
          </div>
        </div>
      )}
      {syncError && (
        <div className="rounded-2xl bg-red-50 px-5 py-4 ring-1 ring-red-200">
          <div className="flex items-center gap-3 text-sm text-red-700">
            <ExclamationCircleIcon className="h-5 w-5" />
            {syncError}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ClockIcon}
          iconBg="bg-sky-50 text-sky-700"
          label="Last sync"
          value={lastSync ? <StatusBadge status={lastSync.status} /> : 'Never'}
          sub={lastSync?.completed_at ? formatDateTime(lastSync.completed_at) : null}
        />
        <StatCard
          icon={CheckCircleIcon}
          iconBg="bg-green-50 text-green-700"
          label="Items synced (last run)"
          value={lastSync?.items_synced ?? '—'}
          sub={`${lastSync?.items_updated ?? 0} prices updated`}
        />
        <StatCard
          icon={ExclamationTriangleIcon}
          iconBg={missingCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'}
          label="Missing prices"
          value={missingCount}
          sub="Active items with no active price"
        />
        <StatCard
          icon={TableCellsIcon}
          iconBg="bg-violet-50 text-violet-700"
          label="Failed (last run)"
          value={lastSync?.items_failed ?? '—'}
          sub={lastSync?.error_message ? 'Errors recorded' : 'No errors'}
        />
      </div>

      {/* Last run errors */}
      {lastSync?.error_message && (
        <div className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200">
          <p className="mb-2 text-sm font-semibold text-red-800">Last sync errors</p>
          <pre className="whitespace-pre-wrap text-xs text-red-700">{lastSync.error_message}</pre>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Missing prices */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-sm font-semibold text-gray-900">Missing Prices</p>
            <p className="mt-0.5 text-xs text-gray-500">Active items with no active price in DB</p>
          </div>
          {missingPrices.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-6 text-sm text-green-700">
              <CheckCircleIcon className="h-5 w-5" />
              All active items have a price.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3 text-left">Code</th>
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {missingPrices.map((item) => (
                    <tr key={item.id} className="hover:bg-amber-50/40">
                      <td className="px-5 py-3 font-mono text-xs text-gray-600">{item.code}</td>
                      <td className="px-5 py-3 text-gray-900">{item.name}</td>
                      <td className="px-5 py-3 text-gray-500">{item.category || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Sync history */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-sm font-semibold text-gray-900">Sync History</p>
            <p className="mt-0.5 text-xs text-gray-500">Last 10 sync runs</p>
          </div>
          {syncHistory.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">No sync runs recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3 text-left">Started</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-right">Synced</th>
                    <th className="px-5 py-3 text-right">Updated</th>
                    <th className="px-5 py-3 text-right">Failed</th>
                    <th className="px-5 py-3 text-left">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {syncHistory.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-xs text-gray-500">{formatDateTime(run.started_at)}</td>
                      <td className="px-5 py-3"><StatusBadge status={run.status} /></td>
                      <td className="px-5 py-3 text-right text-gray-900">{run.items_synced}</td>
                      <td className="px-5 py-3 text-right text-gray-900">{run.items_updated}</td>
                      <td className="px-5 py-3 text-right font-medium text-red-600">{run.items_failed || 0}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">{run.triggered_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Price audit log */}
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-100 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900">Recent Price Changes</p>
          <p className="mt-0.5 text-xs text-gray-500">Last 30 price changes tracked from all sources</p>
        </div>
        {auditLog.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500">No price changes recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 text-left">When</th>
                  <th className="px-5 py-3 text-left">Item</th>
                  <th className="px-5 py-3 text-right">Old Price</th>
                  <th className="px-5 py-3 text-right">New Price</th>
                  <th className="px-5 py-3 text-left">Effective</th>
                  <th className="px-5 py-3 text-left">Changed By</th>
                  <th className="px-5 py-3 text-left">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {auditLog.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-xs text-gray-500">{formatDateTime(entry.created_at)}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{entry.item_name}</p>
                      {entry.item_code && <p className="text-xs text-gray-400 font-mono">{entry.item_code}</p>}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-400">
                      {entry.old_price != null ? formatCurrency(entry.old_price) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(entry.new_price)}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{entry.effective_date || '—'}</td>
                    <td className="px-5 py-3 text-xs text-gray-600">{entry.changed_by}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        entry.source === 'google_sheets' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {entry.source || 'manual'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
