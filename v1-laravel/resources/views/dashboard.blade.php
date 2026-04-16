@extends('layouts.app')
@section('title', 'Dashboard')
@section('content')
<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
    @if($user->isAdmin())
    <div class="card"><div class="text-sm font-medium text-gray-500">Total Orders</div><div class="mt-1 text-3xl font-semibold text-gray-900">{{ $data['totalOrders'] }}</div></div>
    <div class="card"><div class="text-sm font-medium text-gray-500">Pending</div><div class="mt-1 text-3xl font-semibold text-yellow-600">{{ $data['pendingOrders'] }}</div></div>
    <div class="card"><div class="text-sm font-medium text-gray-500">Completed</div><div class="mt-1 text-3xl font-semibold text-green-600">{{ $data['completedOrders'] }}</div></div>
    <div class="card"><div class="text-sm font-medium text-gray-500">This Month</div><div class="mt-1 text-3xl font-semibold text-primary-600">{{ $data['thisMonthOrders'] }}</div></div>
    @elseif($user->isAccountant())
    <div class="card"><div class="text-sm font-medium text-gray-500">Completed Orders</div><div class="mt-1 text-3xl font-semibold text-green-600">{{ $data['completedOrders'] }}</div></div>
    <div class="card"><div class="text-sm font-medium text-gray-500">This Month Completed</div><div class="mt-1 text-3xl font-semibold text-primary-600">{{ $data['thisMonthCompleted'] }}</div></div>
    <div class="card"><div class="text-sm font-medium text-gray-500">Unread Notifications</div><div class="mt-1 text-3xl font-semibold text-red-600">{{ $data['unreadNotifications'] }}</div></div>
    @elseif($user->isStoreUser())
    <div class="card"><div class="text-sm font-medium text-gray-500">Sent Orders</div><div class="mt-1 text-3xl font-semibold text-blue-600">{{ $data['sentOrders'] }}</div></div>
    <div class="card"><div class="text-sm font-medium text-gray-500">Received Orders</div><div class="mt-1 text-3xl font-semibold text-purple-600">{{ $data['receivedOrders'] }}</div></div>
    <div class="card"><div class="text-sm font-medium text-gray-500">Pending Actions</div><div class="mt-1 text-3xl font-semibold text-yellow-600">{{ $data['pendingActions'] }}</div></div>
    <div class="card"><div class="text-sm font-medium text-gray-500">Unread Notifications</div><div class="mt-1 text-3xl font-semibold text-red-600">{{ $data['unreadNotifications'] }}</div></div>
    @endif
</div>

@if($user->isStoreUser())
<div class="mb-4"><a href="{{ route('orders.create') }}" class="btn-primary">+ New Order</a></div>
@endif

<div class="card">
    <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50"><tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr></thead>
            <tbody class="bg-white divide-y divide-gray-200">
                @forelse($data['recentOrders'] as $order)
                <tr class="hover:bg-gray-50 cursor-pointer" onclick="window.location='{{ route('orders.show', $order) }}'">
                    <td class="px-4 py-3 text-sm font-medium text-primary-600">{{ $order->order_number }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">{{ $order->fromStore->code }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">{{ $order->toStore->code }}</td>
                    <td class="px-4 py-3 text-sm">
                        @php $colors = ['draft'=>'gray','submitted'=>'blue','preparing'=>'yellow','shipped'=>'indigo','received'=>'purple','completed'=>'green','cancelled'=>'red']; $c = $colors[$order->status] ?? 'gray'; @endphp
                        <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-{{ $c }}-100 text-{{ $c }}-800">{{ ucfirst($order->status) }}</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500">{{ $order->created_at->format('M d, Y') }}</td>
                </tr>
                @empty
                <tr><td colspan="5" class="px-4 py-8 text-center text-sm text-gray-500">No orders yet</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>
@endsection
