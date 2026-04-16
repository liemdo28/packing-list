@extends('layouts.app')
@section('title', 'Invoice ' . $invoice->invoice_number)

@section('content')
<div class="max-w-4xl mx-auto">
    <div class="mb-6">
        <a href="{{ route('invoices.index') }}" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Invoices</a>
        <h2 class="text-2xl font-bold text-gray-900 mt-2">Invoice: {{ $invoice->invoice_number }}</h2>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 class="text-sm font-semibold text-gray-500 uppercase mb-3">Invoice Details</h4>
            <dl class="space-y-2 text-sm">
                <div class="flex justify-between"><dt class="text-gray-500">Supplier</dt><dd class="font-medium">{{ $invoice->supplier }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Invoice #</dt><dd class="font-medium">{{ $invoice->invoice_number }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Date</dt><dd>{{ $invoice->invoice_date->format('d M Y') }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Store</dt><dd>{{ $invoice->store->name ?? '-' }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Total</dt><dd class="font-bold text-lg">{{ number_format($invoice->total_amount, 2) }}</dd></div>
            </dl>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 class="text-sm font-semibold text-gray-500 uppercase mb-3">Reconciliation</h4>
            <dl class="space-y-2 text-sm">
                <div class="flex justify-between"><dt class="text-gray-500">Status</dt><dd><x-badge :color="$invoice->reconciled ? 'green' : 'yellow'">{{ $invoice->reconciled ? 'Reconciled' : 'Pending' }}</x-badge></dd></div>
                @if($invoice->reconciled)
                <div class="flex justify-between"><dt class="text-gray-500">Reconciled At</dt><dd>{{ $invoice->reconciled_at?->format('d M Y H:i') }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Reconciled By</dt><dd>{{ $invoice->reconciledByUser->name ?? '-' }}</dd></div>
                @endif
            </dl>
            @if($invoice->notes)
            <div class="mt-3 pt-3 border-t"><p class="text-xs text-gray-500">Notes:</p><p class="text-sm text-gray-700">{{ $invoice->notes }}</p></div>
            @endif
        </div>
    </div>

    <!-- Invoice Lines -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div class="p-5 border-b"><h3 class="text-lg font-semibold text-gray-900">Invoice Lines</h3></div>
        @if(!$invoice->reconciled)
        <form method="POST" action="{{ route('invoices.reconcile', $invoice) }}">
            @csrf
        @endif
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        @unless($invoice->reconciled)<th class="px-4 py-3 text-left font-medium text-gray-500">Match</th>@endunless
                        <th class="px-4 py-3 text-left font-medium text-gray-500">Description</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Item</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-500">Qty</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-500">Unit Price</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-500">Total</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @foreach($invoice->lines as $line)
                    <tr class="hover:bg-gray-50">
                        @unless($invoice->reconciled)
                        <td class="px-4 py-3">
                            <input type="checkbox" name="matched_lines[]" value="{{ $line->id }}" {{ $line->matched ? 'checked' : '' }}
                                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                        </td>
                        @endunless
                        <td class="px-4 py-3 text-gray-700">{{ $line->description }}</td>
                        <td class="px-4 py-3 text-gray-500 hidden sm:table-cell">{{ $line->item->name ?? '-' }}</td>
                        <td class="px-4 py-3 text-right text-gray-700">{{ number_format($line->qty, 2) }}</td>
                        <td class="px-4 py-3 text-right text-gray-700">{{ number_format($line->unit_price, 2) }}</td>
                        <td class="px-4 py-3 text-right font-medium text-gray-900">{{ number_format($line->line_total, 2) }}</td>
                        <td class="px-4 py-3">
                            <x-badge :color="$line->matched ? 'green' : 'gray'">{{ $line->matched ? 'Matched' : 'Unmatched' }}</x-badge>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
                <tfoot class="bg-gray-50">
                    <tr>
                        <td colspan="{{ $invoice->reconciled ? 5 : 6 }}" class="px-4 py-3 text-right font-semibold text-gray-700">Total</td>
                        <td class="px-4 py-3 text-right font-bold text-gray-900">{{ number_format($invoice->linesTotal(), 2) }}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>
        @unless($invoice->reconciled)
        <div class="p-4 border-t flex justify-end">
            <button type="submit" class="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700" onclick="return confirm('Mark this invoice as reconciled?')">
                Reconcile Invoice
            </button>
        </div>
        </form>
        @endunless
    </div>
</div>
@endsection
