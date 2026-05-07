import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import {
  getOrder,
  submitOrder,
  acceptOrder,
  rejectOrder,
  prepareOrder,
  shipOrder,
  receiveOrder,
  completeOrder,
  cancelOrder,
} from '../../../api/orders';
import Badge from '../../../components/Badge';
import Alert from '../../../components/Alert';
import ConfirmDialog from '../../../components/ConfirmDialog';
import LoadingSpinner from '../../../components/LoadingSpinner';
import WorkflowPanel from '../../../components/WorkflowPanel';
import EmptyState from '../../../components/EmptyState';
import SupplierReviewModal from '../components/SupplierReviewModal';
import ReceivingModal from '../components/ReceivingModal';
import QuantityComparisonTable from '../components/QuantityComparisonTable';
import { useAuth } from '../../../hooks/useAuth';
import { useAction } from '../../../hooks/useAction';
import { formatDateTime, formatCurrency } from '../../../utils/formatters';
import {
  getBlockedReason,
  getPrimaryAction,
  getRecommendedMessage,
  getSecondaryActions,
  getWorkflowSteps,
} from '../../../utils/workflow';

const SIMPLE_HANDLERS = {
  submit:  (id) => submitOrder(id),
  prepare: (id) => prepareOrder(id),
  ship:    (id) => shipOrder(id),
  complete:(id) => completeOrder(id),
  cancel:  (id, payload) => cancelOrder(id, payload),
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showReceivingModal, setShowReceivingModal] = useState(false);

  const dispatcher = useCallback(async (fn, ...args) => fn(...args), []);
  const { execute: dispatchAction } = useAction(dispatcher);

  function fetchOrder() {
    setLoading(true);
    getOrder(id)
      .then((res) => setOrder(res.data.data))
      .catch(() => setError('Failed to load order'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const primaryAction = order ? getPrimaryAction(order, user) : null;
  const secondaryActions = order ? getSecondaryActions(order, user) : [];
  const workflowMessage = order ? getRecommendedMessage(order, user) : null;
  const blockedReason = order ? getBlockedReason(user, order) : null;

  async function runSimpleAction(actionKey) {
    setPendingAction(actionKey);
    setError('');
    setSuccess('');

    try {
      const payload = actionKey === 'cancel'
        ? { cancel_reason: cancelReason || 'Cancelled by user' }
        : {};
      await dispatchAction(SIMPLE_HANDLERS[actionKey], id, payload);
      setSuccess(`Order ${actionKey === 'cancel' ? 'cancelled' : 'updated'} successfully.`);
      setConfirmationAction(null);
      setCancelReason('');
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${actionKey} order`);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleAccept(payload) {
    setPendingAction('accept');
    setError('');
    try {
      await acceptOrder(id, payload);
      setShowSupplierModal(false);
      setSuccess('Order accepted successfully.');
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept order');
    } finally {
      setPendingAction(null);
    }
  }

  async function handleReject(payload) {
    setPendingAction('reject');
    setError('');
    try {
      await rejectOrder(id, payload);
      setShowSupplierModal(false);
      setSuccess('Order rejected.');
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject order');
    } finally {
      setPendingAction(null);
    }
  }

  async function handleReceive(payload) {
    setPendingAction('receive');
    setError('');
    try {
      await receiveOrder(id, payload);
      setShowReceivingModal(false);
      setSuccess('Receipt confirmed successfully.');
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm receipt');
    } finally {
      setPendingAction(null);
    }
  }

  function triggerAction(action) {
    if (!action) return;

    if (action.key === 'accept') {
      setShowSupplierModal(true);
      return;
    }
    if (action.key === 'receive') {
      setShowReceivingModal(true);
      return;
    }
    if (action.confirmation) {
      setConfirmationAction(action);
      return;
    }

    runSimpleAction(action.key);
  }

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;
  if (!order) return <Alert type="error" message="Order not found" />;

  const timeline = getWorkflowSteps(order);
  const showReceived = ['receiving_review', 'discrepancy_review', 'completed'].includes(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link to="/orders" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to Orders
        </Link>
        <Badge status={order.status} className="px-3 py-1 text-sm" />
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-7 text-white shadow-xl">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Header Summary</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{order.order_number}</h1>
            <p className="mt-2 text-sm text-slate-300">
              {order.fromStore?.code} ({order.fromStore?.name}) &rarr; {order.toStore?.code} ({order.toStore?.name})
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Created by {order.creator?.full_name || 'Unknown'} on {formatDateTime(order.created_at)}
            </p>
            {order.notes && (
              <p className="mt-4 max-w-2xl rounded-2xl bg-white/8 px-4 py-3 text-sm text-slate-200 ring-1 ring-white/10">
                {order.notes}
              </p>
            )}
            {order.supplier_note && (
              <p className="mt-2 max-w-2xl rounded-2xl bg-teal-900/40 px-4 py-3 text-sm text-teal-200 ring-1 ring-teal-700/40">
                <span className="font-semibold">Supplier note:</span> {order.supplier_note}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Current step</p>
              <p className="mt-2 text-xl font-semibold">{workflowMessage?.title?.replace('Next action: ', '') || 'Review order'}</p>
            </div>
            <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Order value</p>
              <p className="mt-2 text-xl font-semibold">{order.total_amount > 0 ? formatCurrency(order.total_amount) : 'Pending snapshot'}</p>
            </div>
            <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Source store</p>
              <p className="mt-2 text-xl font-semibold">{order.fromStore?.code}</p>
            </div>
            <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Destination store</p>
              <p className="mt-2 text-xl font-semibold">{order.toStore?.code}</p>
            </div>
          </div>
        </div>
      </section>

      <WorkflowPanel steps={timeline} message={workflowMessage} />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900">Item Summary</p>
              <p className="mt-1 text-sm text-gray-500">Requested, confirmed, and received quantities.</p>
            </div>

            {order.lines?.length > 0 ? (
              <QuantityComparisonTable lines={order.lines} showReceived={showReceived} />
            ) : (
              <EmptyState
                title="No line items on this order."
                description="Add items before moving the workflow forward."
              />
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900">Activity Log</p>
              <p className="mt-1 text-sm text-gray-500">A simple timeline so staff can understand what already happened.</p>
            </div>
            <div className="space-y-4">
              {timeline.map((step) => (
                <div key={step.key} className="flex gap-4">
                  <div className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${step.state === 'upcoming' ? 'bg-gray-300' : step.state === 'current' ? 'bg-sky-500' : 'bg-emerald-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{step.label}</p>
                    <p className="mt-1 text-xs text-gray-500">{step.timestamp ? formatDateTime(step.timestamp) : 'Waiting for this step'}</p>
                    <p className="mt-1 text-xs text-gray-400">{step.actorLabel || 'No recorded actor yet'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900">Action Area</p>
              <p className="mt-1 text-sm text-gray-500">One primary action per step keeps the workflow clear and harder to misuse.</p>
            </div>

            {primaryAction ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Recommended Next Action</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{primaryAction.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{primaryAction.helper}</p>
                </div>

                <button
                  type="button"
                  onClick={() => triggerAction(primaryAction)}
                  disabled={Boolean(pendingAction)}
                  className="btn-primary flex w-full items-center justify-center py-3 text-base"
                >
                  {pendingAction === primaryAction.key ? 'Processing...' : primaryAction.label}
                  {pendingAction !== primaryAction.key && <ArrowRightIcon className="ml-2 h-4 w-4" />}
                </button>

                {secondaryActions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Secondary Actions</p>
                    {secondaryActions.map((action) => (
                      <button
                        key={action.key}
                        type="button"
                        onClick={() => triggerAction(action)}
                        disabled={Boolean(pendingAction)}
                        className={action.key === 'cancel' || action.key === 'reject' ? 'btn-danger w-full' : 'btn-secondary w-full'}
                      >
                        {pendingAction === action.key ? 'Processing...' : action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Alert type="info" message={blockedReason || 'No action is available for your role at this step.'} />
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900">Order Metadata</p>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-500">Created</dt>
                <dd className="font-medium text-gray-900">{formatDateTime(order.created_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-500">Submitted</dt>
                <dd className="font-medium text-gray-900">{formatDateTime(order.submitted_at) || '—'}</dd>
              </div>
              {order.accepted_at && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Accepted</dt>
                  <dd className="font-medium text-gray-900">{formatDateTime(order.accepted_at)}</dd>
                </div>
              )}
              {order.rejected_at && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500 text-red-600">Rejected</dt>
                  <dd className="font-medium text-red-700">{formatDateTime(order.rejected_at)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-500">Shipped</dt>
                <dd className="font-medium text-gray-900">{formatDateTime(order.shipped_at) || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-500">Completed</dt>
                <dd className="font-medium text-gray-900">{formatDateTime(order.completed_at) || '—'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(confirmationAction)}
        onClose={() => {
          if (!pendingAction) {
            setConfirmationAction(null);
          }
        }}
        onConfirm={() => runSimpleAction(confirmationAction.key)}
        title={confirmationAction?.confirmation?.title}
        message={
          <div className="space-y-4">
            <p>{confirmationAction?.confirmation?.description}</p>
            <div className="rounded-2xl bg-gray-50 p-4 text-left text-sm text-gray-600">
              <p><span className="font-medium text-gray-900">Route:</span> {order.fromStore?.code} &rarr; {order.toStore?.code}</p>
              <p className="mt-2"><span className="font-medium text-gray-900">Items:</span> {order.lines?.length || 0}</p>
              <p className="mt-2"><span className="font-medium text-gray-900">Current value:</span> {order.total_amount > 0 ? formatCurrency(order.total_amount) : 'Pending snapshot'}</p>
            </div>
            {confirmationAction?.key === 'cancel' && (
              <textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                className="input-field w-full"
                rows={3}
                placeholder="Reason for cancellation"
              />
            )}
          </div>
        }
        confirmText={confirmationAction?.confirmation?.confirmText}
        confirmColor={confirmationAction?.riskLevel === 'danger' ? 'danger' : 'primary'}
        loading={Boolean(pendingAction)}
      />

      {showSupplierModal && (
        <SupplierReviewModal
          order={order}
          onAccept={handleAccept}
          onReject={handleReject}
          loading={pendingAction === 'accept' || pendingAction === 'reject'}
          onClose={() => !pendingAction && setShowSupplierModal(false)}
        />
      )}

      {showReceivingModal && (
        <ReceivingModal
          order={order}
          onReceive={handleReceive}
          loading={pendingAction === 'receive'}
          onClose={() => !pendingAction && setShowReceivingModal(false)}
        />
      )}
    </div>
  );
}
