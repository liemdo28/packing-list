import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Badge from '@/Components/Badge';
import Modal from '@/Components/Modal';
import {
    CheckCircleIcon,
    TruckIcon,
    PaperAirplaneIcon,
    XCircleIcon,
    ClipboardDocumentCheckIcon,
    CogIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const statusSteps = ['draft', 'submitted', 'processing', 'ready_to_ship', 'in_transit', 'received_pending_confirmation', 'completed'];

const stepLabels = {
    draft: 'Draft',
    submitted: 'Submitted',
    processing: 'Processing',
    ready_to_ship: 'Ready to Ship',
    in_transit: 'In Transit',
    received_pending_confirmation: 'Received',
    completed: 'Completed',
};

function StatusTimeline({ currentStatus }) {
    const currentIndex = statusSteps.indexOf(currentStatus);
    const isCancelled = currentStatus === 'cancelled';
    const isDisputed = currentStatus === 'disputed';

    return (
        <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6 mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Order Progress</h3>
            {isCancelled ? (
                <div className="flex items-center justify-center py-4">
                    <XCircleIcon className="h-8 w-8 text-red-500 mr-2" />
                    <span className="text-lg font-semibold text-red-400 glow-red">Order Cancelled</span>
                </div>
            ) : isDisputed ? (
                <div className="flex items-center justify-center py-4">
                    <ExclamationTriangleIcon className="h-8 w-8 text-pink-500 mr-2" />
                    <span className="text-lg font-semibold text-pink-400">Order Disputed</span>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    {statusSteps.map((step, index) => {
                        const isCompleted = index <= currentIndex;
                        const isCurrent = index === currentIndex;
                        return (
                            <div key={step} className="flex flex-col items-center flex-1">
                                <div className="flex items-center w-full">
                                    {index > 0 && (
                                        <div className={`flex-1 h-0.5 ${index <= currentIndex ? 'bg-red-500' : 'bg-gray-700'}`} />
                                    )}
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                            isCurrent
                                                ? 'bg-red-600 text-white ring-4 ring-red-500/30'
                                                : isCompleted
                                                ? 'bg-red-600 text-white'
                                                : 'bg-gray-700 text-gray-400'
                                        }`}
                                    >
                                        {isCompleted && !isCurrent ? (
                                            <CheckCircleIcon className="h-5 w-5" />
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    {index < statusSteps.length - 1 && (
                                        <div className={`flex-1 h-0.5 ${index < currentIndex ? 'bg-red-500' : 'bg-gray-700'}`} />
                                    )}
                                </div>
                                <span className={`mt-2 text-xs text-center ${isCurrent ? 'font-bold text-red-400' : 'text-gray-500'}`}>
                                    {stepLabels[step] || step}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function OrdersShow({ order, user, isSender, isReceiver }) {
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [disputeReason, setDisputeReason] = useState('');

    const markReadyForm = useForm({
        lines: (order.lines || []).map((line) => ({
            id: line.id,
            shipped_qty: line.shipped_qty ?? line.requested_qty,
        })),
    });

    const receiveForm = useForm({
        lines: (order.lines || []).map((line) => ({
            id: line.id,
            received_qty: line.received_qty ?? line.shipped_qty ?? 0,
        })),
    });

    const handleSubmitOrder = () => {
        router.post(`/orders/${order.id}/submit`);
    };

    const handleProcessOrder = () => {
        router.post(`/orders/${order.id}/process`);
    };

    const handleMarkReady = (e) => {
        e.preventDefault();
        markReadyForm.post(`/orders/${order.id}/mark-ready`);
    };

    const handleTransit = () => {
        router.post(`/orders/${order.id}/transit`);
    };

    const handleReceive = (e) => {
        e.preventDefault();
        receiveForm.post(`/orders/${order.id}/receive`);
    };

    const handleComplete = () => {
        router.post(`/orders/${order.id}/complete`);
    };

    const handleCancel = () => {
        router.post(`/orders/${order.id}/cancel`, { cancel_reason: cancelReason }, {
            onSuccess: () => {
                setShowCancelModal(false);
                setCancelReason('');
            },
        });
    };

    const handleDispute = () => {
        router.post(`/orders/${order.id}/dispute`, { dispute_reason: disputeReason }, {
            onSuccess: () => {
                setShowDisputeModal(false);
                setDisputeReason('');
            },
        });
    };

    const canBeCancelled = ['draft', 'submitted', 'processing'].includes(order.status);
    const showMarkReadyForm = isSender && order.status === 'processing';
    const showReceiveForm = isReceiver && order.status === 'in_transit';

    const grandTotal = order.status === 'completed'
        ? (order.lines || []).reduce((sum, line) => {
            const qty = line.final_qty || line.received_qty || line.shipped_qty || line.requested_qty;
            const price = line.unit_price || 0;
            return sum + qty * price;
        }, 0)
        : null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <Layout>
            <Head title={`Order ${order.order_number}`} />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Order {order.order_number}</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Created by {order.creator?.name} on {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                        </p>
                    </div>
                    <Badge status={order.status} />
                </div>

                {/* Status Timeline */}
                <StatusTimeline currentStatus={order.status} />

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    {/* Sender: Submit (draft) */}
                    {isSender && order.status === 'draft' && (
                        <button
                            onClick={handleSubmitOrder}
                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                        >
                            <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                            Submit Order
                        </button>
                    )}
                    {/* Sender: Start Processing (submitted) */}
                    {isSender && order.status === 'submitted' && (
                        <button
                            onClick={handleProcessOrder}
                            className="inline-flex items-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500"
                        >
                            <CogIcon className="h-4 w-4 mr-2" />
                            Start Processing
                        </button>
                    )}
                    {/* Sender: Ship / In Transit (ready_to_ship) */}
                    {isSender && order.status === 'ready_to_ship' && (
                        <button
                            onClick={handleTransit}
                            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                        >
                            <TruckIcon className="h-4 w-4 mr-2" />
                            Ship / In Transit
                        </button>
                    )}
                    {/* Receiver: Complete (received_pending_confirmation) */}
                    {isReceiver && order.status === 'received_pending_confirmation' && (
                        <button
                            onClick={handleComplete}
                            className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
                        >
                            <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
                            Complete Order
                        </button>
                    )}
                    {/* Receiver: Dispute (received_pending_confirmation) */}
                    {isReceiver && order.status === 'received_pending_confirmation' && (
                        <button
                            onClick={() => setShowDisputeModal(true)}
                            className="inline-flex items-center rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-500"
                        >
                            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                            Dispute Order
                        </button>
                    )}
                    {/* Cancel (draft, submitted, processing) */}
                    {canBeCancelled && (isSender || user?.role === 'admin') && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                        >
                            <XCircleIcon className="h-4 w-4 mr-2" />
                            Cancel Order
                        </button>
                    )}
                </div>

                {/* Order Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Order Details</h3>
                        <dl className="space-y-3">
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-400">From Store</dt>
                                <dd className="text-sm font-medium text-white">{order.from_store?.name}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-400">To Store</dt>
                                <dd className="text-sm font-medium text-white">{order.to_store?.name}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-400">Status</dt>
                                <dd><Badge status={order.status} /></dd>
                            </div>
                            {order.notes && (
                                <div>
                                    <dt className="text-sm text-gray-400 mb-1">Notes</dt>
                                    <dd className="text-sm text-gray-200 bg-gray-800/50 p-2 rounded border border-gray-700/50">{order.notes}</dd>
                                </div>
                            )}
                            {order.cancel_reason && (
                                <div>
                                    <dt className="text-sm text-gray-400 mb-1">Cancel Reason</dt>
                                    <dd className="text-sm text-red-400 bg-red-500/10 p-2 rounded border border-red-500/30">{order.cancel_reason}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Timeline</h3>
                        <dl className="space-y-3">
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-400">Created</dt>
                                <dd className="text-sm text-gray-200">{order.created_at ? new Date(order.created_at).toLocaleString() : '-'}</dd>
                            </div>
                            {order.submitted_at && (
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-400">Submitted</dt>
                                    <dd className="text-sm text-gray-200">{new Date(order.submitted_at).toLocaleString()}</dd>
                                </div>
                            )}
                            {order.processing_at && (
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-400">Processing</dt>
                                    <dd className="text-sm text-gray-200">{new Date(order.processing_at).toLocaleString()}</dd>
                                </div>
                            )}
                            {order.ready_at && (
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-400">Ready to Ship</dt>
                                    <dd className="text-sm text-gray-200">{new Date(order.ready_at).toLocaleString()}</dd>
                                </div>
                            )}
                            {order.shipped_at && (
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-400">In Transit</dt>
                                    <dd className="text-sm text-gray-200">{new Date(order.shipped_at).toLocaleString()}</dd>
                                </div>
                            )}
                            {order.received_at && (
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-400">Received</dt>
                                    <dd className="text-sm text-gray-200">{new Date(order.received_at).toLocaleString()}</dd>
                                </div>
                            )}
                            {order.completed_at && (
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-400">Completed</dt>
                                    <dd className="text-sm text-gray-200">{new Date(order.completed_at).toLocaleString()}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {/* Mark Ready Form (shown during processing) */}
                {showMarkReadyForm && (
                    <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Mark Ready to Ship - Enter Shipped Quantities</h3>
                        <form onSubmit={handleMarkReady}>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700/50">
                                    <thead className="bg-[#252540]">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Item</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Requested Qty</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Shipped Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700/50">
                                        {order.lines?.map((line, index) => (
                                            <tr key={line.id}>
                                                <td className="px-6 py-4 text-sm text-gray-200">
                                                    {line.item?.code} - {line.item?.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-200">{line.requested_qty}</td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={line.requested_qty}
                                                        value={markReadyForm.data.lines[index]?.shipped_qty ?? 0}
                                                        onChange={(e) => {
                                                            const updated = [...markReadyForm.data.lines];
                                                            updated[index] = { ...updated[index], shipped_qty: parseInt(e.target.value) || 0 };
                                                            markReadyForm.setData('lines', updated);
                                                        }}
                                                        className="w-24 rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={markReadyForm.processing}
                                    className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50"
                                >
                                    {markReadyForm.processing ? 'Saving...' : 'Mark Ready to Ship'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Receive Form */}
                {showReceiveForm && (
                    <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Receive Order - Enter Received Quantities (Pending Confirmation)</h3>
                        <form onSubmit={handleReceive}>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700/50">
                                    <thead className="bg-[#252540]">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Item</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Shipped Qty</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Received Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700/50">
                                        {order.lines?.map((line, index) => (
                                            <tr key={line.id}>
                                                <td className="px-6 py-4 text-sm text-gray-200">
                                                    {line.item?.code} - {line.item?.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-200">{line.shipped_qty}</td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={line.shipped_qty}
                                                        value={receiveForm.data.lines[index]?.received_qty ?? 0}
                                                        onChange={(e) => {
                                                            const updated = [...receiveForm.data.lines];
                                                            updated[index] = { ...updated[index], received_qty: parseInt(e.target.value) || 0 };
                                                            receiveForm.setData('lines', updated);
                                                        }}
                                                        className="w-24 rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={receiveForm.processing}
                                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                                >
                                    {receiveForm.processing ? 'Saving...' : 'Confirm Receipt'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Order Lines Table */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-700/50">
                        <h3 className="text-lg font-medium text-white">Order Lines</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/50">
                            <thead className="bg-[#252540]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Item</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Requested</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Shipped</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Received</th>
                                    {order.status === 'completed' && (
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Final Qty</th>
                                    )}
                                    {order.status === 'completed' && (
                                        <>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Unit Price</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {order.lines?.map((line) => {
                                    const finalQty = line.final_qty || line.received_qty || line.shipped_qty || line.requested_qty;
                                    const lineTotal = (line.unit_price || 0) * finalQty;
                                    return (
                                        <tr key={line.id} className="hover:bg-gray-800/50">
                                            <td className="px-6 py-4 text-sm text-gray-200">
                                                <div className="font-medium">{line.item?.name}</div>
                                                <div className="text-gray-500">{line.item?.code} ({line.item?.unit})</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-200 text-right">{line.requested_qty}</td>
                                            <td className="px-6 py-4 text-sm text-gray-200 text-right">{line.shipped_qty ?? '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-200 text-right">{line.received_qty ?? '-'}</td>
                                            {order.status === 'completed' && (
                                                <td className="px-6 py-4 text-sm text-gray-200 text-right">{line.final_qty ?? '-'}</td>
                                            )}
                                            {order.status === 'completed' && (
                                                <>
                                                    <td className="px-6 py-4 text-sm text-gray-200 text-right">
                                                        {line.unit_price ? formatCurrency(line.unit_price) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-white text-right">
                                                        {line.unit_price ? formatCurrency(lineTotal) : '-'}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {order.status === 'completed' && grandTotal !== null && (
                                <tfoot className="bg-[#252540]">
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-sm font-bold text-white text-right">Grand Total</td>
                                        <td className="px-6 py-4 text-sm font-bold text-emerald-400 text-right glow-green">{formatCurrency(grandTotal)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>

            {/* Cancel Modal */}
            <Modal show={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Order">
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                        Are you sure you want to cancel this order? This action cannot be undone.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Reason for cancellation</label>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={3}
                            className="block w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                            placeholder="Enter reason..."
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowCancelModal(false)}
                            className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 shadow-sm hover:bg-gray-600"
                        >
                            Keep Order
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={!cancelReason.trim()}
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                        >
                            Cancel Order
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Dispute Modal */}
            <Modal show={showDisputeModal} onClose={() => setShowDisputeModal(false)} title="Dispute Order">
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                        Dispute this order if the received quantities or items do not match expectations.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Reason for dispute</label>
                        <textarea
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            rows={3}
                            className="block w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                            placeholder="Describe the issue..."
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowDisputeModal(false)}
                            className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 shadow-sm hover:bg-gray-600"
                        >
                            Go Back
                        </button>
                        <button
                            type="button"
                            onClick={handleDispute}
                            disabled={!disputeReason.trim()}
                            className="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 disabled:opacity-50"
                        >
                            Submit Dispute
                        </button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
}
