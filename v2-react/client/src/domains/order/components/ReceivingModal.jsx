import { useState } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function ReceivingModal({ order, onReceive, loading, onClose }) {
  const [lines, setLines] = useState(
    (order?.lines || []).map((l) => ({
      id: l.id,
      quantity: parseFloat(l.quantity),
      confirmed_quantity: l.confirmed_quantity != null ? parseFloat(l.confirmed_quantity) : null,
      received_quantity: l.received_quantity != null ? parseFloat(l.received_quantity) : parseFloat(l.confirmed_quantity ?? l.quantity),
      receiver_note: l.receiver_note || '',
      item: l.item,
    }))
  );
  const [note, setNote] = useState('');

  function updateLine(idx, field, value) {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function handleSubmit() {
    onReceive({ lines, note });
  }

  const discrepancyLines = lines.filter((l) => {
    const baseline = l.confirmed_quantity ?? l.quantity;
    return parseFloat(l.received_quantity) < parseFloat(baseline);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Confirm Receipt</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {order?.order_number} · Enter quantities you actually received
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={loading} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-4">
          <p className="text-sm text-gray-600">
            Enter the exact quantities received for each item. Discrepancies will be flagged for review.
          </p>

          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Item</th>
                {lines.some((l) => l.confirmed_quantity != null) && (
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Confirmed</th>
                )}
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Received Qty</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map((line, idx) => {
                const baseline = line.confirmed_quantity ?? line.quantity;
                const received = parseFloat(line.received_quantity);
                const isShort = received < parseFloat(baseline);
                const isMissing = received === 0;
                return (
                  <tr key={line.id} className={isMissing ? 'bg-red-50' : isShort ? 'bg-amber-50' : ''}>
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-900">{line.item?.name}</p>
                      <p className="text-xs text-gray-400">{line.item?.code} · {line.item?.unit}</p>
                      {line.supplier_note && (
                        <p className="mt-0.5 text-xs italic text-blue-600">Supplier: {line.supplier_note}</p>
                      )}
                    </td>
                    {lines.some((l) => l.confirmed_quantity != null) && (
                      <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                        {line.confirmed_quantity != null ? line.confirmed_quantity : <span className="text-gray-400">—</span>}
                      </td>
                    )}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.received_quantity}
                        onChange={(e) => updateLine(idx, 'received_quantity', e.target.value)}
                        className={`input-field text-right tabular-nums text-sm w-24 ml-auto ${isMissing ? 'ring-red-400 text-red-800' : isShort ? 'ring-amber-400 text-amber-800' : ''}`}
                      />
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell">
                      <input
                        type="text"
                        value={line.receiver_note}
                        onChange={(e) => updateLine(idx, 'receiver_note', e.target.value)}
                        className="input-field text-sm"
                        placeholder="Optional note"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {discrepancyLines.length > 0 && (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
              <strong>{discrepancyLines.length} item{discrepancyLines.length > 1 ? 's' : ''}</strong> received less than expected.
              Submitting will flag this order for discrepancy review.
            </div>
          )}

          <div>
            <label className="label-field">Overall note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field mt-1"
              rows={2}
              placeholder="Any notes about this delivery..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <CheckIcon className="h-4 w-4" />
            {loading ? 'Submitting...' : 'Confirm Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
}
