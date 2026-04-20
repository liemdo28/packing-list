<?php

namespace App\Domains\Order\Http\Controllers;

use App\Domains\Order\Models\Order;
use App\Domains\Inventory\Models\Item;
use App\Domains\User\Models\Store;
use App\Domains\Order\Services\OrderService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function __construct(protected OrderService $orderService) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Order::with('fromStore', 'toStore', 'creator');

        if ($user->isStoreUser()) {
            $query->forStore($user->store_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $orders = $query->latest()->paginate(20)->withQueryString();
        $statuses = config('packinglist.statuses');

        return Inertia::render('Orders/Index', compact('orders', 'statuses'));
    }

    public function create(Request $request)
    {
        $user = $request->user();
        $fromStore = $user->store;

        if (!$fromStore) {
            return redirect()->route('orders.index')->with('error', 'You are not assigned to a store.');
        }

        $allowedCodes = $fromStore->getAllowedDestinations();
        if (empty($allowedCodes)) {
            return redirect()->route('orders.index')->with('error', 'Your store cannot send orders.');
        }

        $destinationStores = Store::whereIn('code', $allowedCodes)->active()->get();
        $items = Item::active()->orderBy('name')->get();

        return Inertia::render('Orders/Create', compact('fromStore', 'destinationStores', 'items'));
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $fromStore = $user->store;

        $data = $request->validate([
            'to_store_id' => 'required|exists:stores,id',
            'notes' => 'nullable|string|max:500',
            'lines' => 'required|array|min:1',
            'lines.*.item_id' => 'required|exists:items,id',
            'lines.*.requested_qty' => 'required|numeric|min:0.01|max:999999',
        ]);

        $toStore = Store::findOrFail($data['to_store_id']);

        if (!$this->orderService->validateTransferRules($fromStore, $toStore)) {
            return back()->with('error', "Transfer from {$fromStore->code} to {$toStore->code} is not allowed.")->withInput();
        }

        $order = $this->orderService->createOrder($data, $user->id, $fromStore->id);

        return redirect()->route('orders.show', $order)->with('success', "Order {$order->order_number} created.");
    }

    public function show(Order $order)
    {
        $order->load('fromStore', 'toStore', 'lines.item', 'creator');
        $user = auth()->user();
        $isSender = $user->store_id === $order->from_store_id;
        $isReceiver = $user->store_id === $order->to_store_id;

        return Inertia::render('Orders/Show', compact('order', 'user', 'isSender', 'isReceiver'));
    }

    public function submit(Order $order)
    {
        if (!$order->canBeSubmitted()) {
            return back()->with('error', 'Order cannot be submitted.');
        }
        try {
            $this->orderService->submitOrder($order->id);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
        return back()->with('success', 'Order submitted successfully.');
    }

    public function process(Order $order)
    {
        if (!$order->canBeProcessed()) {
            return back()->with('error', 'Order cannot be processed.');
        }
        try {
            $this->orderService->processOrder($order->id);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
        return back()->with('success', 'Order is now being processed.');
    }

    public function markReady(Request $request, Order $order)
    {
        if (!$order->canBeReadyToShip()) {
            return back()->with('error', 'Order cannot be marked ready to ship.');
        }

        $data = $request->validate([
            'lines' => 'required|array',
            'lines.*.id' => 'required|exists:order_lines,id',
            'lines.*.shipped_qty' => 'required|numeric|min:0|max:999999',
            'lines.*.notes' => 'nullable|string|max:500',
        ]);

        try {
            $this->orderService->markReadyToShip($order->id, $data['lines']);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
        return back()->with('success', 'Quantities entered. Order ready to ship.');
    }

    public function transit(Order $order)
    {
        if (!$order->canBeInTransit()) {
            return back()->with('error', 'Order cannot be marked in transit.');
        }
        try {
            $this->orderService->markInTransit($order->id);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
        return back()->with('success', 'Order is now in transit.');
    }

    public function receive(Request $request, Order $order)
    {
        if (!$order->canBeReceived()) {
            return back()->with('error', 'Order cannot be received.');
        }

        $data = $request->validate([
            'lines' => 'required|array',
            'lines.*.id' => 'required|exists:order_lines,id',
            'lines.*.received_qty' => 'required|numeric|min:0|max:999999',
            'lines.*.notes' => 'nullable|string|max:500',
        ]);

        try {
            $this->orderService->receiveOrder($order->id, $data['lines']);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
        return back()->with('success', 'Order received. Pending confirmation.');
    }

    public function complete(Order $order)
    {
        if (!$order->canBeCompleted()) {
            return back()->with('error', 'Order cannot be completed.');
        }
        try {
            $this->orderService->completeOrder($order->id);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
        return back()->with('success', 'Order completed. Prices snapshot taken.');
    }

    public function cancel(Request $request, Order $order)
    {
        if (!$order->canBeCancelled()) {
            return back()->with('error', 'Order cannot be cancelled.');
        }

        $data = $request->validate([
            'cancel_reason' => 'required|string|max:500',
        ]);

        try {
            $this->orderService->cancelOrder($order->id, $data['cancel_reason']);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
        return back()->with('success', 'Order cancelled.');
    }

    public function dispute(Request $request, Order $order)
    {
        if (!$order->canBeDisputed()) {
            return back()->with('error', 'Order cannot be disputed.');
        }

        $data = $request->validate([
            'dispute_reason' => 'required|string|max:500',
        ]);

        try {
            $this->orderService->disputeOrder($order->id, $data['dispute_reason']);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
        return back()->with('success', 'Order has been disputed.');
    }
}
