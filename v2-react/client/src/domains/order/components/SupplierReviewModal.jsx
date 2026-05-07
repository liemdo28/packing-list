import { useState } from 'react';
import { XMarkIcon, CheckIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function SupplierReviewModal({ order, onAccept, onReject, loading, onClose }) {
  const [lines, setLines] = useState(
    (order?.lines || []).map((l) => ({
      id: l.id,
      quantity: parseFloat(l.quantity),
      confirmed_quantity: l.confirmed_quantity != null ? parseFloat(l.confirmed_quantity) : parseFloat(l.quantity),
      supplier_note: l.supplier_note || '',
      item: l.item,
    }))
  );
  const [note, setNote] = useState(order?.supplier_note || '');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  function updateLine(idx, field, value) {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function handleAccept() {
    onAccept({ lines, note });
  }

  function handleReject() {
    onReject({ reason: rejectReason, note });
  }

  const hasAdjustments = lines.some((l) => parseFloat(l.confirmed_quantity) !== parseFloat(l.quantity));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Supplier Review</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {order?.order_number} · {order?.fromStore?.code} → {order?.toStore?.code}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={loading} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {showRejectForm ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
                You are about to reject this order. The requesting store will be notified.
              </div>
              <div>
                <label className="label-field">Reason for rejection <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="input-field mt-1"
                  rows={3}
                  placeholder="Explain why you cannot fulfill this order..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Review the quantities below. Adjust the <strong>Confirmed Qty</strong> if you can only partially fulfill any item.
              </p>
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Item</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Requested</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Confirmed Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((line, idx) => {
                    const isAdjusted = parseFloat(line.confirmed_quantity) !== parseFloat(line.quantity);
                    return (
                      <tr key={line.id} className={isAdjusted ? 'bg-yellow-50' : ''}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-gray-900">{line.item?.name}</p>
                          <p className="text-xs text-gray-400">{line.item?.code} · {line.item?.unit}</p>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-600">{line.quantity}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.confirmed_quantity}
                            onChange={(e) => updateLine(idx, 'confirmed_quantity', e.target.value)}
                            className={`input-field text-right tabular-nums text-sm w-24 ml-auto ${isAdjusted ? 'ring-yellow-400 text-yellow-800' : ''}`}
                          />
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell">
                          <input
                            type="text"
                            value={line.supplier_note}
                            onChange={(e) => updateLine(idx, 'supplier_note', e.target.value)}
                            className="input-field text-sm"
                            placeholder="Optional note"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {hasAdjustments && (
                <div className="rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800 ring-1 ring-yellow-200">
                  You have adjusted {lines.filter((l) => parseFloat(l.confirmed_quantity) !== parseFloat(l.quantity)).length} item(s). The requester will be notified of the changes.
                </div>
              )}

              <div>
                <label className="label-field">Overall note (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input-field mt-1"
                  rows={2}
                  placeholder="Any additional message to the requesting store..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          {showRejectForm ? (
            <>
              <button type="button" onClick={() => setShowRejectForm(false)} disabled={loading} className="btn-secondary">
                Back
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={loading || !rejectReason.trim()}
                className="btn-danger flex items-center gap-2"
              >
                <XCircleIcon className="h-4 w-4" />
                {loading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                disabled={loading}
                className="btn-danger flex items-center gap-2"
              >
                <XCircleIcon className="h-4 w-4" />
                Reject Order
              </button>
              <button
                type="button"
                onClick={handleAccept}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <CheckIcon className="h-4 w-4" />
                {loading ? 'Accepting...' : 'Accept Order'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
