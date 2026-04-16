@extends('layouts.app')
@section('title', 'Monthly Summary')

@section('content')
<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
    <h2 class="text-2xl font-bold text-gray-900">Transfer Summary</h2>
    <div class="flex space-x-2">
        <a href="{{ route('summary.exportExcel', ['year' => $year, 'month' => $month]) }}" class="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export CSV
        </a>
        <a href="{{ route('summary.exportPdf', ['year' => $year, 'month' => $month]) }}" class="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            Export PDF
        </a>
    </div>
</div>

{{-- Period Selector --}}
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
    <form method="GET" class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <select name="year" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
                @foreach($years as $y)
                <option value="{{ $y }}" {{ $year == $y ? 'selected' : '' }}>{{ $y }}</option>
                @endforeach
            </select>
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Month</label>
            <select name="month" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
                @foreach($months as $m => $name)
                <option value="{{ $m }}" {{ $month == $m ? 'selected' : '' }}>{{ $name }}</option>
                @endforeach
            </select>
        </div>
        <div>
            <button type="submit" class="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">View Summary</button>
        </div>
        <div>
            <a href="{{ route('summary.index', ['year' => $year, 'month' => $month, 'recalculate' => 1]) }}"
               class="block w-full bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 text-center">
                Recalculate
            </a>
        </div>
    </form>
</div>

{{-- Stats Cards --}}
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
    <x-stat-card title="Total Orders" :value="$grandOrders" color="blue"
        icon='<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>' />
    <x-stat-card title="Total Amount" :value="number_format($grandTotal, 2)" color="green"
        icon='<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>' />
</div>

{{-- Pair Tabs --}}
@php
    $pairs = [
        ['label' => 'All Pairs', 'from' => null, 'to' => null],
        ['label' => 'B1 - B2', 'from' => 'B1', 'to' => 'B2'],
        ['label' => 'B1 - B3', 'from' => 'B1', 'to' => 'B3'],
        ['label' => 'B3 - B1', 'from' => 'B3', 'to' => 'B1'],
        ['label' => 'B3 - B2', 'from' => 'B3', 'to' => 'B2'],
    ];
@endphp

<div x-data="{ activeTab: 'all' }" class="mb-6">
    {{-- Tab Navigation --}}
    <div class="border-b border-gray-200 mb-0">
        <nav class="flex -mb-px space-x-4 overflow-x-auto" aria-label="Tabs">
            <button @click="activeTab = 'all'" :class="activeTab === 'all' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                    class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors">
                All Pairs
            </button>
            @foreach($stores as $fromStore)
                @foreach($fromStore->allowedDestinations() as $toStore)
                <button @click="activeTab = '{{ $fromStore->code }}-{{ $toStore->code }}'"
                        :class="activeTab === '{{ $fromStore->code }}-{{ $toStore->code }}' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                        class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors">
                    {{ $fromStore->code }} &rarr; {{ $toStore->code }}
                </button>
                @endforeach
            @endforeach
        </nav>
    </div>

    {{-- Tab Content --}}
    <div class="bg-white rounded-b-lg shadow-sm border border-gray-200 border-t-0 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-500">From Store</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-500">To Store</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-500">Orders</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-500">Total Amount</th>
                        <th class="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @forelse($summaries as $summary)
                    <tr class="hover:bg-gray-50"
                        x-show="activeTab === 'all' || activeTab === '{{ $summary->fromStore->code ?? '' }}-{{ $summary->toStore->code ?? '' }}'">
                        <td class="px-4 py-3 font-medium text-gray-900">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {{ $summary->fromStore->code ?? '-' }}
                            </span>
                            {{ $summary->fromStore->name ?? '-' }}
                        </td>
                        <td class="px-4 py-3 text-gray-700">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {{ $summary->toStore->code ?? '-' }}
                            </span>
                            {{ $summary->toStore->name ?? '-' }}
                        </td>
                        <td class="px-4 py-3 text-right text-gray-700">{{ $summary->total_orders }}</td>
                        <td class="px-4 py-3 text-right font-medium text-gray-900">{{ number_format($summary->total_amount, 2) }}</td>
                        <td class="px-4 py-3 text-center">
                            <a href="{{ route('summary.detail', ['year' => $year, 'month' => $month, 'from_store' => $summary->from_store_id, 'to_store' => $summary->to_store_id]) }}"
                               class="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                Drill Down
                            </a>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                            No summary data for {{ $months[$month] ?? '' }} {{ $year }}. Click "Recalculate" to generate from completed orders.
                        </td>
                    </tr>
                    @endforelse
                </tbody>
                @if($summaries->isNotEmpty())
                <tfoot class="bg-gray-50">
                    <tr>
                        <td colspan="2" class="px-4 py-3 font-semibold text-gray-700">Grand Total</td>
                        <td class="px-4 py-3 text-right font-semibold text-gray-700">{{ $grandOrders }}</td>
                        <td class="px-4 py-3 text-right font-bold text-gray-900 text-lg">{{ number_format($grandTotal, 2) }}</td>
                        <td></td>
                    </tr>
                </tfoot>
                @endif
            </table>
        </div>
    </div>
</div>

{{-- Period Summary --}}
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ $months[$month] ?? '' }} {{ $year }} - Summary by Direction</h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        @foreach($summaries as $summary)
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600">{{ $summary->fromStore->code ?? '?' }} &rarr; {{ $summary->toStore->code ?? '?' }}</span>
                <span class="text-xs text-gray-400">{{ $summary->total_orders }} orders</span>
            </div>
            <p class="text-xl font-bold text-gray-900">{{ number_format($summary->total_amount, 2) }}</p>
        </div>
        @endforeach
    </div>
</div>
@endsection
