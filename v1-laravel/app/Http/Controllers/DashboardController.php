<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $data = [];

        if ($user->isAdmin()) {
            $data['totalOrders'] = Order::count();
            $data['pendingOrders'] = Order::whereNotIn('status', ['completed', 'cancelled'])->count();
            $data['completedOrders'] = Order::where('status', 'completed')->count();
            $data['thisMonthOrders'] = Order::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count();
            $data['recentOrders'] = Order::with('fromStore', 'toStore')->latest()->take(10)->get();
        } elseif ($user->isAccountant()) {
            $data['completedOrders'] = Order::where('status', 'completed')->count();
            $data['thisMonthCompleted'] = Order::where('status', 'completed')->whereMonth('completed_at', now()->month)->whereYear('completed_at', now()->year)->count();
            $data['recentOrders'] = Order::with('fromStore', 'toStore')->where('status', 'completed')->latest('completed_at')->take(10)->get();
            $data['unreadNotifications'] = $user->unreadNotificationsCount();
        } elseif ($user->isStoreUser()) {
            $storeId = $user->store_id;
            $data['sentOrders'] = Order::where('from_store_id', $storeId)->count();
            $data['receivedOrders'] = Order::where('to_store_id', $storeId)->count();
            $data['pendingActions'] = Order::where(function ($q) use ($storeId) {
                $q->where('from_store_id', $storeId)->whereIn('status', ['submitted', 'processing', 'ready_to_ship'])
                  ->orWhere(function ($q2) use ($storeId) {
                      $q2->where('to_store_id', $storeId)->whereIn('status', ['in_transit', 'received_pending_confirmation']);
                  });
            })->count();
            $data['recentOrders'] = Order::with('fromStore', 'toStore')->forStore($storeId)->latest()->take(10)->get();
            $data['unreadNotifications'] = $user->unreadNotificationsCount();
        }

        return Inertia::render('Dashboard', compact('data', 'user'));
    }
}
