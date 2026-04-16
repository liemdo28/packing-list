@extends('layouts.app')
@section('title', 'Orders')
@section('content')
<div class="sm:flex sm:items-center sm:justify-between mb-6">
    <div></div>
    <div class="mt-4 sm:mt-0 flex gap-2">
        @if(auth()->user()->isStoreUser())
        <a href="{{ route('orders.create') }}" class="btn-primary">+ New Order</a>
        @endif
        <a href="{{ route('export.orders.excel') }}?{{ http_build_query(request()->query()) }}" class="btn-secondary">Export Excel</a>
    </div>
</div>
<div class="card mb-6">
    <form method="GET" class="flex flex-wrap gap-4">
        <select name="status" class="input-field w-auto">
            <option value="">All Status</option>
            @foreach($statuses as $key => $label)<option value="{{ $key }}" {{ request('status') == $key ? 'selected' : '' }}>{{ $label }}</option>@endforeach
        </select>
        <input type="date" name="from_date" value="{{ request('from_date') }}" class="input-field w-auto" placeholder="From">
        <input type="date" name="to_date" value="{{ request('to_date') }}" class="input-field w-auto" placeholder="To">
        <button type="submit" class="btn-primary">Filter</button>
        <a href="{{ route('orders.index') }}" class="btn-secondary">Reset</a>
    </form>
</div>
<div class="card">
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50"><tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr></thead>
            <tbody class="divide-y divide-gray-200">
                @forelse($orders as $order)
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm font-medium"><a href="{{ route('orders.show', $order) }}" class="text-primary-600 hover:underline">{{ $order->order_number }}</a></td>
                    <td class="px-4 py-3 text-sm">{{ $order->fromStore->code }}</td>
                    <td class="px-4 py-3 text-sm">{{ $order->toStore->code }}</td>
                    <td class="px-4 py-3 text-sm">{{ $order->lines_count ?? $order->lines->count() }}</td>
                    <td class="px-4 py-3 text-sm">
                        @php $c = config('packinglist.status_colors')[$order->status] ?? 'gray'; @endphp
                        <span class="inline-flex rounded-full px-2 text-xs font-semibold bg-{{ $c }}-100 text-{{ $c }}-800">{{ ucfirst($order->status) }}</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500">{{ $order->created_at->format('M d, Y') }}</td>
                    <td class="px-4 py-3 text-sm"><a href="{{ route('orders.show', $order) }}" class="text-primary-600 hover:underline">View</a></td>
                </tr>
                @empty
                <tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No orders found</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="mt-4">{{ $orders->links() }}</div>
</div>
@endsection
