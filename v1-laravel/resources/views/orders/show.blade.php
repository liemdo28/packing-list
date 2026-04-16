@extends('layouts.app')
@section('title', 'Order ' . $order->order_number)

@section('content')
<div class="max-w-5xl mx-auto">
    <div class="mb-6 flex flex-col sm:flex-row justify-between items-start gap-3">
        <div>
            <a href="{{ route('orders.index') }}" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Orders</a>
            <h2 class="text-2xl font-bold text-gray-900 mt-2">{{ $order->order_number }}</h2>
        </div>
        <div class="flex flex-wrap gap-2">
            @if($order->status === 'draft')
            <a href="{{ route('orders.edit', $order) }}" class="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700">Edit</a>
            <form method="POST" action="{{ route('orders.submit', $order) }}" class="inline">
                @csrf
                <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Submit</button>
            </form>
            @endif
            @if($order->status === 'submitted')
            <form method="POST" action="{{ route('orders.prepare', $order) }}" class="inline">
                @csrf
                <button type="submit" class="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700">Start Preparing</button>
            </form>
            @endif
            @if($order->canTransitionTo('cancelled'))
            <button type="button" x-data @click="$dispatch('open-cancel-modal')" class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">Cancel</button>
            @endif
            <a href="{{ route('export.orderPdf', $order) }}" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">PDF</a>
            <button type="button" onclick="window.print()" class="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600">
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                Print
            </button>
        </div>
    </div>

    <!-- Status Timeline -->
    @include('orders._status_timeline', ['order' => $order])

    <!-- Order Details -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 class="text-sm font-semibold text-gray-500 uppercase mb-3">Details</h4>
            <dl class="space-y-2 text-sm">
                <div class="flex justify-between"><dt class="text-gray-500">Status</dt><dd><x-badge :color="$order->statusBadgeColor()">{{ ucfirst($order->status) }}</x-badge></dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">From</dt><dd class="font-medium">{{ $order->fromStore->name }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">To</dt><dd class="font-medium">{{ $order->toStore->name }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Created By</dt><dd>{{ $order->creator->name ?? '-' }}</dd></div>
            </dl>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 class="text-sm font-semibold text-gray-500 uppercase mb-3">Timeline</h4>
            <dl class="space-y-2 text-sm">
                <div class="flex justify-between"><dt class="text-gray-500">Created</dt><dd>{{ $order->created_at->format('d M Y H:i') }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Submitted</dt><dd>{{ $order->submitted_at?->format('d M Y H:i') ?? '-' }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Shipped</dt><dd>{{ $order->shipped_at?->format('d M Y H:i') ?? '-' }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Received</dt><dd>{{ $order->received_at?->format('d M Y H:i') ?? '-' }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Completed</dt><dd>{{ $order->completed_at?->format('d M Y H:i') ?? '-' }}</dd></div>
            </dl>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 class="text-sm font-semibold text-gray-500 uppercase mb-3">Summary</h4>
            <dl class="space-y-2 text-sm">
                <div class="flex justify-between"><dt class="text-gray-500">Total Items</dt><dd class="font-medium">{{ $order->lines->count() }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Total Qty</dt><dd class="font-medium">{{ number_format($order->totalRequestedQty(), 2) }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Total Amount</dt><dd class="font-bold text-lg">{{ number_format($order->totalAmount(), 2) }}</dd></div>
            </dl>
            @if($order->notes)
            <div class="mt-3 pt-3 border-t">
                <p class="text-xs text-gray-500">Notes:</p>
                <p class="text-sm text-gray-700">{{ $order->notes }}</p>
            </div>
            @endif
            @if($order->cancel_reason)
            <div class="mt-3 pt-3 border-t">
                <p class="text-xs text-red-500 font-medium">Cancel Reason:</p>
                <p class="text-sm text-red-700">{{ $order->cancel_reason }}</p>
            </div>
            @endif
        </div>
    </div>

    <!-- Ship Form (if preparing) -->
    @if($order->status === 'preparing')
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Ship Order - Enter Shipped Quantities</h3>
        <form method="POST" action="{{ route('orders.ship', $order) }}">
            @csrf
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left font-medium text-gray-500">Item</th>
                            <th class="px-4 py-2 text-left font-medium text-gray-500">Requested</th>
                            <th class="px-4 py-2 text-left font-medium text-gray-500">Shipped Qty</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        @foreach($order->lines as $line)
                        <tr>
                            <td class="px-4 py-2">{{ $line->item->name ?? '-' }}</td>
                            <td class="px-4 py-2">{{ number_format($line->requested_qty, 2) }}</td>
                            <td class="px-4 py-2">
                                <input type="number" name="shipped_qty[{{ $line->id }}]" value="{{ $line->requested_qty }}" step="0.01" min="0"
                                       class="w-24 px-2 py-1 border border-gray-300 rounded text-sm">
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            <div class="mt-4 flex justify-end">
                <button type="submit" class="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">Mark as Shipped</button>
            </div>
        </form>
    </div>
    @endif

    <!-- Receive Form (if shipped) -->
    @if($order->status === 'shipped')
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Receive Order - Enter Received Quantities</h3>
        <form method="POST" action="{{ route('orders.receive', $order) }}">
            @csrf
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left font-medium text-gray-500">Item</th>
                            <th class="px-4 py-2 text-left font-medium text-gray-500">Shipped</th>
                            <th class="px-4 py-2 text-left font-medium text-gray-500">Received Qty</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        @foreach($order->lines as $line)
                        <tr>
                            <td class="px-4 py-2">{{ $line->item->name ?? '-' }}</td>
                            <td class="px-4 py-2">{{ number_format($line->shipped_qty, 2) }}</td>
                            <td class="px-4 py-2">
                                <input type="number" name="received_qty[{{ $line->id }}]" value="{{ $line->shipped_qty }}" step="0.01" min="0"
                                       class="w-24 px-2 py-1 border border-gray-300 rounded text-sm">
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            <div class="mt-4 flex justify-end">
                <button type="submit" class="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">Mark as Received</button>
            </div>
        </form>
    </div>
    @endif

    <!-- Complete Button (if received) -->
    @if($order->status === 'received')
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex justify-end">
        <form method="POST" action="{{ route('orders.complete', $order) }}">
            @csrf
            <button type="submit" class="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700" onclick="return confirm('Complete this order? Prices will be finalized.')">Complete Order</button>
        </form>
    </div>
    @endif

    <!-- Order Lines Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-5 border-b"><h3 class="text-lg font-semibold text-gray-900">Order Lines</h3></div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-500">#</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-500">Item</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-500">Requested</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-500">Shipped</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-500">Received</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-500">Unit Price</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-500">Total</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @foreach($order->lines as $i => $line)
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 text-gray-500">{{ $i + 1 }}</td>
                        <td class="px-4 py-3">
                            <div class="font-medium text-gray-900">{{ $line->item->name ?? '-' }}</div>
                            <div class="text-xs text-gray-500">{{ $line->item->code ?? '' }} | {{ $line->item->unit ?? '' }}</div>
                        </td>
                        <td class="px-4 py-3 text-right text-gray-700">{{ number_format($line->requested_qty, 2) }}</td>
                        <td class="px-4 py-3 text-right text-gray-700">{{ $line->shipped_qty !== null ? number_format($line->shipped_qty, 2) : '-' }}</td>
                        <td class="px-4 py-3 text-right text-gray-700">{{ $line->received_qty !== null ? number_format($line->received_qty, 2) : '-' }}</td>
                        <td class="px-4 py-3 text-right text-gray-700">{{ number_format($line->unit_price, 2) }}</td>
                        <td class="px-4 py-3 text-right font-medium text-gray-900">{{ number_format($line->line_total, 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
                <tfoot class="bg-gray-50">
                    <tr>
                        <td colspan="6" class="px-4 py-3 text-right font-semibold text-gray-700">Grand Total</td>
                        <td class="px-4 py-3 text-right font-bold text-gray-900 text-lg">{{ number_format($order->totalAmount(), 2) }}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</div>

<!-- Cancel Modal -->
<x-modal name="cancel-modal" title="Cancel Order">
    <form method="POST" action="{{ route('orders.cancel', $order) }}">
        @csrf
        <p class="text-sm text-gray-600 mb-4">Are you sure you want to cancel this order? This action cannot be undone.</p>
        <div class="mb-4">
            <label for="cancel_reason" class="block text-sm font-medium text-gray-700 mb-1">Reason for cancellation</label>
            <textarea name="cancel_reason" id="cancel_reason" rows="3" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
        </div>
        <div class="flex justify-end space-x-3">
            <button type="button" @click="$dispatch('close-cancel-modal')" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Confirm Cancel</button>
        </div>
    </form>
</x-modal>
@endsection
