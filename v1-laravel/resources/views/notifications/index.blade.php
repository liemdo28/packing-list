@extends('layouts.app')
@section('title', 'Notifications')

@section('content')
<div class="max-w-3xl mx-auto">
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Notifications</h2>
        <form method="POST" action="{{ route('notifications.markAllRead') }}">
            @csrf
            <button type="submit" class="text-sm text-blue-600 hover:text-blue-800 font-medium">Mark all as read</button>
        </form>
    </div>

    <div class="space-y-3">
        @forelse($notifications as $notification)
        <div class="bg-white rounded-xl shadow-sm border {{ $notification->is_read ? 'border-gray-200' : 'border-blue-300 bg-blue-50' }} p-4">
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        @unless($notification->is_read)
                        <span class="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                        @endunless
                        <h3 class="text-sm font-semibold text-gray-900">{{ $notification->title }}</h3>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">{{ $notification->message }}</p>
                    <p class="text-xs text-gray-400 mt-2">{{ $notification->created_at->diffForHumans() }}</p>
                </div>
                <div class="flex items-center space-x-2 ml-4 flex-shrink-0">
                    @if($notification->order_id)
                    <a href="{{ route('orders.show', $notification->order_id) }}" class="text-xs text-blue-600 hover:underline">View Order</a>
                    @endif
                    @unless($notification->is_read)
                    <form method="POST" action="{{ route('notifications.markRead', $notification) }}">
                        @csrf
                        <button type="submit" class="text-xs text-gray-500 hover:text-gray-700">Mark read</button>
                    </form>
                    @endunless
                </div>
            </div>
        </div>
        @empty
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            <p class="text-gray-500">No notifications yet.</p>
        </div>
        @endforelse
    </div>

    <div class="mt-4">{{ $notifications->links() }}</div>
</div>
@endsection
