<?php

namespace App\Domains\Notification\Services;

use App\Domains\Notification\Models\Notification;
use App\Domains\Order\Models\Order;
use App\Domains\User\Models\User;

class NotificationService
{
    public function notifyOrderSubmitted(Order $order): void
    {
        $users = User::where('store_id', $order->to_store_id)->where('active', true)->get();
        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'type' => 'order_submitted',
                'title' => 'New Order Received',
                'message' => "Order {$order->order_number} from {$order->fromStore->code} has been submitted.",
                'created_at' => now(),
            ]);
        }
    }

    public function notifyOrderProcessing(Order $order): void
    {
        $users = User::where('store_id', $order->from_store_id)->where('active', true)->get();
        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'type' => 'order_processing',
                'title' => 'Order Processing',
                'message' => "Order {$order->order_number} is now being processed by {$order->toStore->code}.",
                'created_at' => now(),
            ]);
        }
    }

    public function notifyOrderReadyToShip(Order $order): void
    {
        $storeIds = [$order->from_store_id, $order->to_store_id];
        $users = User::whereIn('store_id', $storeIds)->where('active', true)->get();
        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'type' => 'order_ready_to_ship',
                'title' => 'Order Ready to Ship',
                'message' => "Order {$order->order_number} is ready to ship from {$order->toStore->code}.",
                'created_at' => now(),
            ]);
        }
    }

    public function notifyOrderInTransit(Order $order): void
    {
        $users = User::where('store_id', $order->from_store_id)->where('active', true)->get();
        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'type' => 'order_in_transit',
                'title' => 'Order In Transit',
                'message' => "Order {$order->order_number} from {$order->toStore->code} is now in transit.",
                'created_at' => now(),
            ]);
        }
    }

    public function notifyOrderReceivedPending(Order $order): void
    {
        $users = User::where('store_id', $order->to_store_id)->where('active', true)->get();
        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'type' => 'order_received_pending',
                'title' => 'Order Received - Pending Confirmation',
                'message' => "Order {$order->order_number} has been received by {$order->fromStore->code} and is pending confirmation.",
                'created_at' => now(),
            ]);
        }
    }

    public function notifyOrderAdjusted(Order $order): void
    {
        $users = User::where('store_id', $order->from_store_id)->where('active', true)->get();
        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'type' => 'order_adjusted',
                'title' => 'Order Quantities Adjusted',
                'message' => "Received quantities for order {$order->order_number} differ from shipped quantities.",
                'created_at' => now(),
            ]);
        }
    }

    public function notifyOrderCompleted(Order $order): void
    {
        $accountants = User::where('role', 'accountant')->where('active', true)->get();
        foreach ($accountants as $user) {
            Notification::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'type' => 'order_completed',
                'title' => 'Order Completed',
                'message' => "Order {$order->order_number} ({$order->fromStore->code} → {$order->toStore->code}) has been completed.",
                'created_at' => now(),
            ]);
        }
    }

    public function notifyOrderCancelled(Order $order): void
    {
        $storeIds = [$order->from_store_id, $order->to_store_id];
        $users = User::whereIn('store_id', $storeIds)->where('active', true)->get();
        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'type' => 'order_cancelled',
                'title' => 'Order Cancelled',
                'message' => "Order {$order->order_number} has been cancelled. Reason: {$order->cancel_reason}",
                'created_at' => now(),
            ]);
        }
    }

    public function notifyOrderDisputed(Order $order): void
    {
        $storeIds = [$order->from_store_id, $order->to_store_id];
        $users = User::whereIn('store_id', $storeIds)->where('active', true)->get();
        $admins = User::where('role', 'admin')->where('active', true)->get();
        $allUsers = $users->merge($admins)->unique('id');

        foreach ($allUsers as $user) {
            Notification::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'type' => 'order_disputed',
                'title' => 'Order Disputed',
                'message' => "Order {$order->order_number} has been disputed. Reason: {$order->cancel_reason}",
                'created_at' => now(),
            ]);
        }
    }
}
