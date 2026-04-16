@extends('layouts.app')
@section('title', 'Invoices')

@section('content')
<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
    <h2 class="text-2xl font-bold text-gray-900">Invoices</h2>
    <a href="{{ route('invoices.create') }}" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">Add Invoice</a>
</div>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
    <form method="GET" class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input type="text" name="search" value="{{ request('search') }}" placeholder="Invoice number..."
               class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
        <select name="store_id" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Stores</option>
            @foreach($stores as $store)
            <option value="{{ $store->id }}" {{ request('store_id') == $store->id ? 'selected' : '' }}>{{ $store->name }}</option>
            @endforeach
        </select>
        <select name="reconciled" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Status</option>
            <option value="0" {{ request('reconciled') === '0' ? 'selected' : '' }}>Unreconciled</option>
            <option value="1" {{ request('reconciled') === '1' ? 'selected' : '' }}>Reconciled</option>
        </select>
        <div class="flex space-x-2">
            <button type="submit" class="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900">Filter</button>
            <a href="{{ route('invoices.index') }}" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Clear</a>
        </div>
    </form>
</div>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Invoice #</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Supplier</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Store</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                    <th class="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                @forelse($invoices as $invoice)
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium text-gray-900">{{ $invoice->invoice_number }}</td>
                    <td class="px-4 py-3 text-gray-700">{{ $invoice->supplier }}</td>
                    <td class="px-4 py-3 text-gray-500 hidden sm:table-cell">{{ $invoice->store->name ?? '-' }}</td>
                    <td class="px-4 py-3 text-gray-500">{{ $invoice->invoice_date->format('d M Y') }}</td>
                    <td class="px-4 py-3 text-right font-medium text-gray-900">{{ number_format($invoice->total_amount, 2) }}</td>
                    <td class="px-4 py-3">
                        <x-badge :color="$invoice->reconciled ? 'green' : 'yellow'">{{ $invoice->reconciled ? 'Reconciled' : 'Pending' }}</x-badge>
                    </td>
                    <td class="px-4 py-3">
                        <a href="{{ route('invoices.show', $invoice) }}" class="text-blue-600 hover:underline text-sm">View</a>
                    </td>
                </tr>
                @empty
                <tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No invoices found.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="px-4 py-3 border-t">{{ $invoices->links() }}</div>
</div>
@endsection
