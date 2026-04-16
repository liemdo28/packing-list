@extends('layouts.app')
@section('title', 'Dashboard')

@section('content')
<div class="mb-6">
    <h2 class="text-2xl font-bold text-gray-900">Welcome back, {{ $user->name }}</h2>
    <p class="text-gray-500 mt-1">{{ ucfirst($user->role) }} {{ $user->store ? '- ' . $user->store->name : '' }}</p>
</div>

{{-- Admin Dashboard --}}
@if($user->isAdmin())
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <x-stat-card title="Total Orders" :value="$data['totalOrders']" color="blue"
        icon='<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>' />
    <x-stat-card title="Pending Orders" :value="$data['pendingOrders']" color="yellow"
        icon='<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>' />
    <x-stat-card title="Completed This Month" :value="$data['monthlyCompleted']" color="green"
        icon='<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>' />
    <x-stat-card title="Monthly Amount" :value="'Rp ' . number_format($data['monthlyAmount'], 0, ',', '.')" color="purple"
        icon='<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>' />
</div>

{{-- Accountant Dashboard --}}
@elseif($user->isAccountant())
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <x-stat-card title="Total Invoices" :value="$data['totalInvoices']" color="blue"
        icon='<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/>' />
    <x-stat-card title="Unreconciled" :value="$data['unreconciledInvoices']" color="red"
        icon='<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>' />
    <x-stat-card title="Completed Orders" :value="$data['completedOrders']" color="green"
        icon='<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>' />
    <x-stat-card title="Monthly Amount" :value="'Rp ' . number_format($data['monthlyAmount'] ?? 0, 0, ',', '.')" color="purple"
        icon='<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>' />
</div>

{{-- Store Dashboard --}}
@else
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <x-stat-card title="Outgoing Orders" :value="$data['outgoingOrders']" color="blue"
        icon='<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>' />
    <x-stat-card title="Incoming Orders" :value="$data['incomingOrders']" color="green"
        icon='<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>' />
    <x-stat-card title="Pending Outgoing" :value="$data['pendingOutgoing']" color="yellow"
        icon='<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>' />
    <x-stat-card title="Pending Incoming" :value="$data['pendingIncoming']" color="purple"
        icon='<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>' />
</div>
@endif

{{-- Quick Actions --}}
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
    @if(!$user->isAccountant() && $user->store && !empty(config('packinglist.transfer_rules.' . $user->storeCode())))
    <a href="{{ route('orders.create') }}" class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition flex items-center">
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        </div>
        <div>
            <p class="font-semibold text-gray-900">New Order</p>
            <p class="text-sm text-gray-500">Create a transfer order</p>
        </div>
    </a>
    @endif

    <a href="{{ route('orders.index') }}" class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition flex items-center">
        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        </div>
        <div>
            <p class="font-semibold text-gray-900">View Orders</p>
            <p class="text-sm text-gray-500">Manage all transfer orders</p>
        </div>
    </a>

    <a href="{{ route('notifications.index') }}" class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition flex items-center">
        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        </div>
        <div>
            <p class="font-semibold text-gray-900">Notifications</p>
            <p class="text-sm text-gray-500">View your notifications</p>
        </div>
    </a>
</div>

{{-- Recent Orders --}}
<div class="bg-white rounded-xl shadow-sm border border-gray-200">
    <div class="p-5 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Recent Orders</h3>
    </div>
    <div class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Order #</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">From</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">To</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                @forelse($data['recentOrders'] as $order)
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">
                        <a href="{{ route('orders.show', $order) }}" class="text-blue-600 hover:underline font-medium">{{ $order->order_number }}</a>
                    </td>
                    <td class="px-4 py-3 text-gray-700">{{ $order->fromStore->name ?? '-' }}</td>
                    <td class="px-4 py-3 text-gray-700">{{ $order->toStore->name ?? '-' }}</td>
                    <td class="px-4 py-3">
                        <x-badge :color="$order->statusBadgeColor()">{{ ucfirst($order->status) }}</x-badge>
                    </td>
                    <td class="px-4 py-3 text-gray-500">{{ $order->created_at->format('d M Y') }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-gray-500">No orders found.</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>
@endsection
