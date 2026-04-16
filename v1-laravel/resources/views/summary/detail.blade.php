@extends('layouts.app')
@section('title', 'Summary Detail')

@section('content')
<div class="max-w-5xl mx-auto">
    <div class="mb-6">
        <a href="{{ route('summary.index', ['year' => $year, 'month' => $month]) }}" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Summary</a>
        <h2 class="text-2xl font-bold text-gray-900 mt-2">{{ $monthName }} {{ $year }} - Completed Orders</h2>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-500">Order #</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-500">From</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-500">To</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-500">Items</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-500">Total</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-500">Completed</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @forelse($orders as $order)
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3">
                            <a href="{{ route('orders.show', $order) }}" class="text-blue-600 hover:underline font-medium">{{ $order->order_number }}</a>
                        </td>
                        <td class="px-4 py-3 text-gray-700">{{ $order->fromStore->name ?? '-' }}</td>
                        <td class="px-4 py-3 text-gray-700">{{ $order->toStore->name ?? '-' }}</td>
                        <td class="px-4 py-3 text-right text-gray-700">{{ $order->lines->count() }}</td>
                        <td class="px-4 py-3 text-right font-medium text-gray-900">{{ number_format($order->lines->sum('line_total'), 2) }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $order->completed_at?->format('d M Y') }}</td>
                    </tr>
                    @empty
                    <tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No completed orders for this period.</td></tr>
                    @endforelse
                </tbody>
                @if($orders->isNotEmpty())
                <tfoot class="bg-gray-50">
                    <tr>
                        <td colspan="4" class="px-4 py-3 font-semibold text-gray-700 text-right">Total</td>
                        <td class="px-4 py-3 text-right font-bold text-gray-900">{{ number_format($orders->sum(fn($o) => $o->lines->sum('line_total')), 2) }}</td>
                        <td></td>
                    </tr>
                </tfoot>
                @endif
            </table>
        </div>
    </div>
</div>
@endsection
