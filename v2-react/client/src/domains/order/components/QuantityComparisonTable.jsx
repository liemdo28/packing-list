import { formatCurrency } from '../../../utils/formatters';

const ITEM_STATUS_COLORS = {
  pending:   'bg-gray-100 text-gray-600',
  confirmed: 'bg-green-100 text-green-700',
  adjusted:  'bg-yellow-100 text-yellow-700',
  short:     'bg-amber-100 text-amber-700',
  missing:   'bg-red-100 text-red-700',
};

const ITEM_STATUS_LABELS = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  adjusted:  'Adjusted',
  short:     'Short',
  missing:   'Missing',
};

export default function QuantityComparisonTable({ lines = [], showReceived = false }) {
  if (!lines.length) return null;

  const hasConfirmed = lines.some((l) => l.confirmed_quantity != null);
  const hasReceived  = showReceived && lines.some((l) => l.received_quantity != null);
  const hasDiscrepancy = lines.some((l) => ['short', 'missing'].includes(l.item_status));

  return (
    <div>
      {hasDiscrepancy && (
        <div className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Some items have quantity discrepancies. Review the highlighted rows below.
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Item</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Requested</th>
              {hasConfirmed && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Confirmed</th>
              )}
              {hasReceived && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Received</th>
              )}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Value</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map((line) => {
              const status = line.item_status || 'pending';
              const isProblematic = ['short', 'missing'].includes(status);
              return (
                <tr key={line.id} className={isProblematic ? 'bg-amber-50' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{line.item?.name}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{line.item?.code} · {line.item?.unit}</p>
                    {line.supplier_note && (
                      <p className="mt-1 text-xs italic text-blue-600">Supplier: {line.supplier_note}</p>
                    )}
                    {line.receiver_note && (
                      <p className="mt-1 text-xs italic text-purple-600">Receiver: {line.receiver_note}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{line.quantity}</td>
                  {hasConfirmed && (
                    <td className={`px-4 py-3 text-right tabular-nums ${line.confirmed_quantity != null && parseFloat(line.confirmed_quantity) !== parseFloat(line.quantity) ? 'font-semibold text-yellow-700' : ''}`}>
                      {line.confirmed_quantity != null ? line.confirmed_quantity : <span className="text-gray-400">—</span>}
                    </td>
                  )}
                  {hasReceived && (
                    <td className={`px-4 py-3 text-right tabular-nums ${isProblematic ? 'font-semibold text-amber-700' : ''}`}>
                      {line.received_quantity != null ? line.received_quantity : <span className="text-gray-400">—</span>}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right font-medium">
                    {line.total_price ? formatCurrency(line.total_price) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ITEM_STATUS_COLORS[status]}`}>
                      {ITEM_STATUS_LABELS[status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
