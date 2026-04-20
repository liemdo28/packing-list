<?php

namespace App\Domains\Order\Services;

use App\Domains\Order\Models\Order;
use App\Domains\Order\Models\OrderLine;
use App\Domains\User\Models\Store;
use App\Domains\Inventory\Models\Item;
use App\Domains\Notification\Services\NotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;

class OrderService
{
    protected const LOCK_TIMEOUT_SECONDS = 5;

    public function __construct(
        protected NotificationService $notificationService
    ) {}

    public function validateTransferRules(Store $from, Store $to): bool
    {
        $rules = config('packinglist.transfer_rules');
        return isset($rules[$from->code]) && in_array($to->code, $rules[$from->code]);
    }

    public function createOrder(array $data, int $userId, int $fromStoreId): Order
    {
        return DB::transaction(function () use ($data, $userId, $fromStoreId) {
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'from_store_id' => $fromStoreId,
                'to_store_id' => $data['to_store_id'],
                'status' => 'draft',
                'created_by' => $userId,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['lines'] as $line) {
                $order->lines()->create([
                    'item_id' => $line['item_id'],
                    'requested_qty' => $line['requested_qty'],
                ]);
            }

            return $order->load('lines.item', 'fromStore', 'toStore');
        });
    }

    /**
     * Submit order with pessimistic lock + idempotency.
     */
    public function submitOrder(int $orderId): Order
    {
        return $this->withOrderLock($orderId, function ($order) {
            if ($order->status !== 'draft') {
                if ($order->status === 'submitted') {
                    return $order; // idempotent
                }
                throw new \Exception("Cannot submit order in status: {$order->status}");
            }

            $order->update([
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);

            $this->notificationService->notifyOrderSubmitted($order);

            return $order->fresh(['lines.item', 'fromStore', 'toStore']);
        });
    }

    /**
     * Process order (start preparing) with lock + idempotency.
     */
    public function processOrder(int $orderId): Order
    {
        return $this->withOrderLock($orderId, function ($order) {
            if ($order->status === 'processing') {
                return $order; // idempotent
            }
            if ($order->status !== 'submitted') {
                throw new \Exception("Cannot process order in status: {$order->status}");
            }

            $order->update([
                'status' => 'processing',
                'processing_at' => now(),
            ]);

            $this->notificationService->notifyOrderProcessing($order);

            return $order->fresh(['lines.item', 'fromStore', 'toStore']);
        });
    }

    /**
     * Mark order ready to ship with lock + idempotency.
     */
    public function markReadyToShip(int $orderId, array $lines): Order
    {
        return $this->withOrderLock($orderId, function ($order) use ($lines) {
            if ($order->status === 'ready_to_ship') {
                return $order; // idempotent
            }
            if ($order->status !== 'processing') {
                throw new \Exception("Cannot mark ready_to_ship in status: {$order->status}");
            }

            foreach ($lines as $lineData) {
                OrderLine::where('id', $lineData['id'])
                    ->where('order_id', $order->id)
                    ->update([
                        'shipped_qty' => $lineData['shipped_qty'],
                        'notes' => $lineData['notes'] ?? null,
                    ]);
            }

            $order->update([
                'status' => 'ready_to_ship',
                'ready_at' => now(),
            ]);

            $this->notificationService->notifyOrderReadyToShip($order);

            return $order->fresh(['lines.item', 'fromStore', 'toStore']);
        });
    }

    /**
     * Mark order in transit (ship) with lock + idempotency.
     */
    public function markInTransit(int $orderId): Order
    {
        return $this->withOrderLock($orderId, function ($order) {
            if ($order->status === 'in_transit') {
                return $order; // idempotent
            }
            if ($order->status !== 'ready_to_ship') {
                throw new \Exception("Cannot mark in_transit in status: {$order->status}");
            }

            $order->update([
                'status' => 'in_transit',
                'shipped_at' => now(),
            ]);

            $this->notificationService->notifyOrderInTransit($order);

            return $order->fresh(['lines.item', 'fromStore', 'toStore']);
        });
    }

    /**
     * Receive order with lock + idempotency.
     */
    public function receiveOrder(int $orderId, array $lines): Order
    {
        return $this->withOrderLock($orderId, function ($order) use ($lines) {
            if ($order->status === 'received_pending_confirmation') {
                return $order; // idempotent
            }
            if (!in_array($order->status, ['in_transit', 'received_pending_confirmation'])) {
                throw new \Exception("Cannot receive order in status: {$order->status}");
            }

            $hasAdjustments = false;

            foreach ($lines as $lineData) {
                $line = OrderLine::where('id', $lineData['id'])
                    ->where('order_id', $order->id)
                    ->first();

                if ($line) {
                    $line->update([
                        'received_qty' => $lineData['received_qty'],
                        'notes' => $lineData['notes'] ?? $line->notes,
                    ]);

                    if ($line->shipped_qty != $lineData['received_qty']) {
                        $hasAdjustments = true;
                    }
                }
            }

            $order->update([
                'status' => 'received_pending_confirmation',
                'received_at' => now(),
            ]);

            $this->notificationService->notifyOrderReceivedPending($order);

            if ($hasAdjustments) {
                $this->notificationService->notifyOrderAdjusted($order);
            }

            return $order->fresh(['lines.item', 'fromStore', 'toStore']);
        });
    }

    /**
     * Complete order with lock + idempotency + price snapshot in transaction.
     */
    public function completeOrder(int $orderId): Order
    {
        return $this->withOrderLock($orderId, function ($order) {
            if ($order->status === 'completed') {
                return $order; // idempotent - already done
            }
            if ($order->status !== 'received_pending_confirmation') {
                throw new \Exception("Cannot complete order in status: {$order->status}");
            }

            // Snapshot prices INSIDE the same transaction (already locked)
            foreach ($order->lines as $line) {
                $price = $line->item->getCurrentPriceValue();
                $qty = $line->getFinalQty();

                $line->update([
                    'unit_price' => $price,
                    'line_total' => round($qty * $price, 2),
                ]);
            }

            $order->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            $this->notificationService->notifyOrderCompleted($order);

            return $order->fresh(['lines.item', 'fromStore', 'toStore']);
        });
    }

    /**
     * Cancel order with lock + idempotency.
     */
    public function cancelOrder(int $orderId, string $reason): Order
    {
        return $this->withOrderLock($orderId, function ($order) use ($reason) {
            if ($order->status === 'cancelled') {
                return $order; // idempotent
            }
            if (!in_array($order->status, ['draft', 'submitted', 'processing'])) {
                throw new \Exception("Cannot cancel order in status: {$order->status}");
            }

            $order->update([
                'status' => 'cancelled',
                'cancel_reason' => $reason,
            ]);

            $this->notificationService->notifyOrderCancelled($order);

            return $order->fresh(['lines.item', 'fromStore', 'toStore']);
        });
    }

    /**
     * Dispute order with lock + idempotency.
     */
    public function disputeOrder(int $orderId, string $reason): Order
    {
        return $this->withOrderLock($orderId, function ($order) use ($reason) {
            if ($order->status === 'disputed') {
                return $order; // idempotent
            }
            if ($order->status !== 'received_pending_confirmation') {
                throw new \Exception("Cannot dispute order in status: {$order->status}");
            }

            $order->update([
                'status' => 'disputed',
                'cancel_reason' => $reason,
            ]);

            $this->notificationService->notifyOrderDisputed($order);

            return $order->fresh(['lines.item', 'fromStore', 'toStore']);
        });
    }

    /**
     * Revert completed order back to received_pending_confirmation (for disputes).
     */
    public function revertToReceived(int $orderId): Order
    {
        return $this->withOrderLock($orderId, function ($order) {
            if ($order->status !== 'completed') {
                throw new \Exception("Can only revert completed orders");
            }

            $order->update([
                'status' => 'received_pending_confirmation',
                'completed_at' => null,
                'unit_price' => null,
                'line_total' => null,
            ]);

            return $order->fresh(['lines.item', 'fromStore', 'toStore']);
        });
    }

    /**
     * Execute a callback within a pessimistic lock on the order row.
     * Uses SELECT ... FOR UPDATE to prevent concurrent modifications.
     *
     * @param int $orderId
     * @param callable $callback
     * @return mixed
     * @throws \Exception
     */
    protected function withOrderLock(int $orderId, callable $callback): mixed
    {
        return DB::transaction(function () use ($orderId, $callback) {
            // Pessimistic row lock — blocks other transactions trying to modify this order
            $order = Order::where('id', $orderId)
                ->lockForUpdate()
                ->first();

            if (!$order) {
                throw new \Exception("Order not found: {$orderId}");
            }

            return $callback($order);
        });
    }

    // ── Legacy methods kept for backward compatibility ─────────────────────

    public function submitOrderByModel(Order $order): Order
    {
        return $this->submitOrder($order->id);
    }

    public function processOrderByModel(Order $order): Order
    {
        return $this->processOrder($order->id);
    }

    public function markReadyToShipByModel(Order $order, array $lines): Order
    {
        return $this->markReadyToShip($order->id, $lines);
    }

    public function markInTransitByModel(Order $order): Order
    {
        return $this->markInTransit($order->id);
    }

    public function receiveOrderByModel(Order $order, array $lines): Order
    {
        return $this->receiveOrder($order->id, $lines);
    }

    public function completeOrderByModel(Order $order): Order
    {
        return $this->completeOrder($order->id);
    }

    public function cancelOrderByModel(Order $order, string $reason): Order
    {
        return $this->cancelOrder($order->id, $reason);
    }

    public function snapshotPrices(Order $order): void
    {
        // No longer used internally (snapshot moved into completeOrder transaction).
        // Kept for backward compatibility with any external callers.
        foreach ($order->lines as $line) {
            $price = $line->item->getCurrentPriceValue();
            $qty = $line->getFinalQty();

            $line->update([
                'unit_price' => $price,
                'line_total' => round($qty * $price, 2),
            ]);
        }
    }
}