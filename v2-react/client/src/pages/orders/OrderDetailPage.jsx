import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { getOrder, submitOrder, prepareOrder, shipOrder, receiveOrder, completeOrder, cancelOrder } from '../../api/orders';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useAction } from '../../hooks/useAction';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { canPerformAction } from '../../utils/helpers';
import { STATUS_LABELS } from '../../utils/constants';

const TIMELINE_STEPS = ['draft', 'submitted', 'preparing', 'shipping', 'received', 'completed'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const dispatcher = useCallback(async (fn, ...args) => fn(...args), []);
  const { execute: runOrderAction, loading: actionLoading } = useAction(dispatcher);

  const fetchOrder = () => {
    setLoading(true);
    getOrder(id)
      .then((res) => setOrder(res.data.data))
      .catch(() => setError('Failed to load order'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleAction = async (actionFn, label) => {
    setError('');
    setSuccess('');
    try {
      await runOrderAction(actionFn, id);
      setSuccess(`Order ${label} successfully`);
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${label} order`);
    }
  };

  const handleCancel = async () => {
    setError('');
    try {
      await runOrderAction(cancelOrder, id, { cancel_reason: cancelReason });
      setCancelDialogOpen(false);
      setSuccess('Order cancelled successfully');
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel order');
    }
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;
  if (!order) return <Alert type="error" message="Order not found" />;

  const currentStepIndex = TIMELINE_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/orders" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Orders
      </Link>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Header */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {order.fromStore?.code} ({order.fromStore?.name}) &rarr; {order.toStore?.code} ({order.toStore?.name})
            </p>
          </div>
          <Badge status={order.status} className="text-sm px-3 py-1" />
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              {TIMELINE_STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step} className="flex flex-col items-center flex-1 relative">
                    {idx > 0 && (
                      <div className={`absolute left-0 right-1/2 top-3.5 h-0.5 -translate-x-1/2 ${
                        idx <= currentStepIndex ? 'bg-primary-600' : 'bg-gray-200'
                      }`} style={{ left: '-50%', right: '50%', width: '100%' }} />
                    )}
                    <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                      isCompleted
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {isCompleted ? (
                        <CheckIcon className="h-4 w-4 text-white" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <span className={`mt-1.5 text-xs font-medium ${
                      isCurrent ? 'text-primary-700' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && order.cancel_reason && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <span className="font-medium">Cancel Reason:</span> {order.cancel_reason}
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Order Lines</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.lines?.map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-2">
                      <p className="font-medium">{line.item?.name}</p>
                      <p className="text-xs text-gray-400">{line.item?.code}</p>
                    </td>
                    <td className="px-4 py-2 text-right">{line.quantity}</td>
                    <td className="px-4 py-2 text-right">{line.unit_price ? formatCurrency(line.unit_price) : '-'}</td>
                    <td className="px-4 py-2 text-right font-medium">{line.total_price ? formatCurrency(line.total_price) : '-'}</td>
                  </tr>
                ))}
              </tbody>
              {order.total_amount > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-semibold">Grand Total</td>
                    <td className="px-4 py-2 text-right font-bold text-primary-700">{formatCurrency(order.total_amount)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="space-y-6">
          {/* Info Panel */}
          <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Information</h2>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-gray-500">Created By</dt><dd className="font-medium">{order.creator?.full_name}</dd></div>
              <div><dt className="text-gray-500">Created At</dt><dd>{formatDateTime(order.created_at)}</dd></div>
              {order.submitted_at && <div><dt className="text-gray-500">Submitted</dt><dd>{formatDateTime(order.submitted_at)}</dd></div>}
              {order.prepared_at && <div><dt className="text-gray-500">Prepared</dt><dd>{formatDateTime(order.prepared_at)}</dd></div>}
              {order.received_at && <div><dt className="text-gray-500">Received</dt><dd>{formatDateTime(order.received_at)}</dd></div>}
              {order.completed_at && <div><dt className="text-gray-500">Completed</dt><dd>{formatDateTime(order.completed_at)}</dd></div>}
              {order.notes && <div><dt className="text-gray-500">Notes</dt><dd>{order.notes}</dd></div>}
            </dl>
          </div>

          {/* Actions */}
          <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-2">
              {canPerformAction(user?.role, order.status, 'submit') && (
                <button onClick={() => handleAction(submitOrder, 'submitted')} disabled={actionLoading} className="btn-primary w-full">
                  Submit Order
                </button>
              )}
              {canPerformAction(user?.role, order.status, 'prepare') && (
                <button onClick={() => handleAction(prepareOrder, 'moved to preparing')} disabled={actionLoading} className="btn-primary w-full">
                  Start Preparing
                </button>
              )}
              {canPerformAction(user?.role, order.status, 'receive') && (
                <button onClick={() => handleAction(receiveOrder, 'received')} disabled={actionLoading} className="btn-success w-full">
                  Confirm Received
                </button>
              )}
              {canPerformAction(user?.role, order.status, 'complete') && (
                <button onClick={() => handleAction(completeOrder, 'completed')} disabled={actionLoading} className="btn-success w-full">
                  Complete Order
                </button>
              )}
              {canPerformAction(user?.role, order.status, 'edit') && (
                <Link to={`/orders/${order.id}/edit`} className="btn-secondary w-full text-center block">
                  Edit Order
                </Link>
              )}
              {canPerformAction(user?.role, order.status, 'cancel') && (
                <button onClick={() => setCancelDialogOpen(true)} disabled={actionLoading} className="btn-danger w-full">
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Order"
        message={
          <div className="space-y-3">
            <p>Are you sure you want to cancel this order?</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="input-field w-full"
              rows={3}
              placeholder="Reason for cancellation (optional)"
            />
          </div>
        }
        confirmText="Cancel Order"
        loading={actionLoading}
      />
    </div>
  );
}
