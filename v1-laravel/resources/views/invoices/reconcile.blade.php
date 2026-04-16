@extends('layouts.app')

@section('title', 'Reconcile Invoice - ' . $invoice->invoice_number)

@section('content')
<div class="max-w-6xl mx-auto">
    {{-- Header --}}
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
            <h2 class="text-2xl font-bold text-gray-800">Reconcile Invoice</h2>
            <p class="text-sm text-gray-500 mt-1">{{ $invoice->invoice_number }} - {{ $invoice->supplier }}</p>
        </div>
        <a href="{{ route('invoices.show', $invoice) }}" class="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to Invoice
        </a>
    </div>

    <form method="POST" action="{{ route('invoices.reconcile.store', $invoice) }}">
        @csrf

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {{-- Invoice Lines --}}
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800">Invoice Lines</h3>
                    <p class="text-sm text-gray-500">Total: {{ number_format($invoice->total_amount, 2) }}</p>
                </div>
                <div class="divide-y divide-gray-200">
                    @foreach($invoice->lines as $line)
                    <div class="px-6 py-4">
                        <label class="flex items-start space-x-3 cursor-pointer">
                            <input type="checkbox" name="matched_lines[]" value="{{ $line->id }}"
                                   class="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                   {{ $line->matched ? 'checked disabled' : '' }}>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-800">{{ $line->description }}</p>
                                <div class="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                    @if($line->item)
                                    <span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{{ $line->item->code }}</span>
                                    @endif
                                    <span>Qty: {{ number_format($line->qty, 2) }}</span>
                                    <span>Price: {{ number_format($line->unit_price, 2) }}</span>
                                    <span class="font-medium text-gray-700">Total: {{ number_format($line->line_total, 2) }}</span>
                                </div>
                                @if($line->matched)
                                <span class="inline-flex items-center mt-1 text-xs text-green-600">
                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                                    Already matched
                                </span>
                                @endif
                            </div>
                        </label>
                    </div>
                    @endforeach
                </div>
            </div>

            {{-- Completed Orders for Reference --}}
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800">Related Orders</h3>
                    <p class="text-sm text-gray-500">Completed orders for {{ $invoice->invoice_date->format('F Y') }}</p>
                </div>
                <div class="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                    @forelse($orders as $order)
                    <div class="px-6 py-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <a href="{{ route('orders.show', $order) }}" class="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                                    {{ $order->order_number }}
                                </a>
                                <p class="text-xs text-gray-500 mt-0.5">
                                    {{ $order->fromStore->name }} &rarr; {{ $order->toStore->name }}
                                </p>
                            </div>
                            <span class="text-sm font-medium text-gray-700">
                                {{ number_format($order->lines->sum('line_total'), 2) }}
                            </span>
                        </div>
                        <div class="mt-2 space-y-1">
                            @foreach($order->lines as $oLine)
                            <div class="text-xs text-gray-500 flex justify-between">
                                <span>{{ $oLine->item->name ?? 'N/A' }} x {{ number_format($oLine->received_qty ?? $oLine->shipped_qty ?? $oLine->requested_qty, 2) }}</span>
                                <span>{{ number_format($oLine->line_total, 2) }}</span>
                            </div>
                            @endforeach
                        </div>
                    </div>
                    @empty
                    <div class="px-6 py-8 text-center">
                        <p class="text-sm text-gray-500">No completed orders found for this period.</p>
                    </div>
                    @endforelse
                </div>
            </div>
        </div>

        {{-- Submit --}}
        <div class="mt-6 flex items-center justify-end space-x-3">
            <a href="{{ route('invoices.show', $invoice) }}" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
            </a>
            <button type="submit" class="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Mark as Reconciled
            </button>
        </div>
    </form>
</div>
@endsection
