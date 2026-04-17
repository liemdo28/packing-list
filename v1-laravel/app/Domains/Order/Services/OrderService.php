<?php

namespace App\Domains\Order\Services;

use App\Domains\Order\Models\Order;
use App\Domains\Order\Models\OrderLine;
use App\Domains\User\Models\Store;
use App\Domains\Inventory\Models\Item;
use App\Domains\Notification\Services\NotificationService;
use Illuminate\Support\Facades\DB;

class OrderService
{
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

    public function submitOrder(Order $order): Order
    {
        $order->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->notificationService->notifyOrderSubmitted($order);

        return $order;
    }

    public function processOrder(Order $order): Order
    {
        $order->update([
            'status' => 'processing',
            'processing_at' => now(),
        ]);

        $this->notificationService->notifyOrderProcessing($order);

        return $order;
    }

    public function markReadyToShip(Order $order, array $lines): Order
    {
        return DB::transaction(function () use ($order, $lines) {
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

            return $order->fresh('lines.item');
        });
    }

    public function markInTransit(Order $order): Order
    {
        $order->update([
            'status' => 'in_transit',
            'shipped_at' => now(),
        ]);

        $this->notificationService->notifyOrderInTransit($order);

        return $order;
    }

    public function receiveOrder(Order $order, array $lines): Order
    {
        return DB::transaction(function () use ($order, $lines) {
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

            return $order->fresh('lines.item');
        });
    }

    public function completeOrder(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            // Calculate final_qty for each line
            foreach ($order->lines as $line) {
                $finalQty = $line->received_qty ?? $line->shipped_qty ?? $line->requested_qty;
                $line->update(['final_qty' => $finalQty]);
            }

            $this->snapshotPrices($order);

            $order->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            $this->notificationService->notifyOrderCompleted($order);

            return $order->fresh('lines.item');
        });
    }

    public function cancelOrder(Order $order, string $reason): Order
    {
        $order->update([
            'status' => 'cancelled',
            'cancel_reason' => $reason,
        ]);

        $this->notificationService->notifyOrderCancelled($order);

        return $order;
    }

    public function disputeOrder(Order $order, string $reason): Order
    {
        $order->update([
            'status' => 'disputed',
            'cancel_reason' => $reason,
        ]);

        $this->notificationService->notifyOrderDisputed($order);

        return $order;
    }

    public function snapshotPrices(Order $order): void
    {
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
