@php
    $statuses = ['draft', 'submitted', 'preparing', 'shipped', 'received', 'completed'];
    $currentIndex = array_search($order->status, $statuses);
    $isCancelled = $order->status === 'cancelled';

    $statusIcons = [
        'draft' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>',
        'submitted' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
        'preparing' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>',
        'shipped' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>',
        'received' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>',
        'completed' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>',
    ];

    $statusLabels = [
        'draft' => 'Draft',
        'submitted' => 'Submitted',
        'preparing' => 'Preparing',
        'shipped' => 'Shipped',
        'received' => 'Received',
        'completed' => 'Completed',
    ];
@endphp

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
    <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Order Progress</h3>

    @if($isCancelled)
    <div class="flex items-center justify-center py-4">
        <div class="flex items-center space-x-3 bg-red-50 border border-red-200 rounded-lg px-6 py-4">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
                <p class="text-lg font-semibold text-red-700">Order Cancelled</p>
                @if($order->cancel_reason)
                <p class="text-sm text-red-600 mt-1">Reason: {{ $order->cancel_reason }}</p>
                @endif
            </div>
        </div>
    </div>
    @else
    {{-- Desktop Timeline --}}
    <div class="hidden md:block">
        <div class="flex items-center justify-between">
            @foreach($statuses as $index => $status)
            @php
                $isCompleted = $currentIndex !== false && $index < $currentIndex;
                $isCurrent = $currentIndex !== false && $index === $currentIndex;
                $isPending = $currentIndex !== false && $index > $currentIndex;
            @endphp

            <div class="flex flex-col items-center relative flex-1">
                {{-- Connector line --}}
                @if($index > 0)
                <div class="absolute top-5 right-1/2 w-full h-0.5 {{ $isCompleted || $isCurrent ? 'bg-indigo-500' : 'bg-gray-200' }}" style="right: 50%; transform: translateX(-50%); width: calc(100% - 2.5rem);"></div>
                @endif

                {{-- Icon circle --}}
                <div class="relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                    {{ $isCompleted ? 'bg-indigo-500 border-indigo-500 text-white' : '' }}
                    {{ $isCurrent ? 'bg-indigo-100 border-indigo-500 text-indigo-600' : '' }}
                    {{ $isPending ? 'bg-gray-100 border-gray-300 text-gray-400' : '' }}">
                    @if($isCompleted)
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    @else
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {!! $statusIcons[$status] !!}
                    </svg>
                    @endif
                </div>

                {{-- Label --}}
                <span class="mt-2 text-xs font-medium
                    {{ $isCompleted ? 'text-indigo-600' : '' }}
                    {{ $isCurrent ? 'text-indigo-700 font-bold' : '' }}
                    {{ $isPending ? 'text-gray-400' : '' }}">
                    {{ $statusLabels[$status] }}
                </span>

                {{-- Timestamp --}}
                @php
                    $timestamp = match($status) {
                        'draft' => $order->created_at,
                        'submitted' => $order->submitted_at,
                        'shipped' => $order->shipped_at,
                        'received' => $order->received_at,
                        'completed' => $order->completed_at,
                        default => null,
                    };
                @endphp
                @if($timestamp)
                <span class="text-xs text-gray-400 mt-1">{{ $timestamp->format('M d, H:i') }}</span>
                @endif
            </div>
            @endforeach
        </div>
    </div>

    {{-- Mobile Timeline --}}
    <div class="md:hidden space-y-4">
        @foreach($statuses as $index => $status)
        @php
            $isCompleted = $currentIndex !== false && $index < $currentIndex;
            $isCurrent = $currentIndex !== false && $index === $currentIndex;
            $isPending = $currentIndex !== false && $index > $currentIndex;
            $timestamp = match($status) {
                'draft' => $order->created_at,
                'submitted' => $order->submitted_at,
                'shipped' => $order->shipped_at,
                'received' => $order->received_at,
                'completed' => $order->completed_at,
                default => null,
            };
        @endphp
        <div class="flex items-start">
            <div class="flex flex-col items-center mr-4">
                <div class="flex items-center justify-center w-8 h-8 rounded-full border-2
                    {{ $isCompleted ? 'bg-indigo-500 border-indigo-500 text-white' : '' }}
                    {{ $isCurrent ? 'bg-indigo-100 border-indigo-500 text-indigo-600' : '' }}
                    {{ $isPending ? 'bg-gray-100 border-gray-300 text-gray-400' : '' }}">
                    @if($isCompleted)
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    @else
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {!! $statusIcons[$status] !!}
                    </svg>
                    @endif
                </div>
                @if($index < count($statuses) - 1)
                <div class="w-0.5 h-6 {{ $isCompleted ? 'bg-indigo-500' : 'bg-gray-200' }}"></div>
                @endif
            </div>
            <div class="pt-1">
                <p class="text-sm font-medium {{ $isCurrent ? 'text-indigo-700' : ($isPending ? 'text-gray-400' : 'text-gray-700') }}">
                    {{ $statusLabels[$status] }}
                </p>
                @if($timestamp)
                <p class="text-xs text-gray-400">{{ $timestamp->format('M d, Y H:i') }}</p>
                @endif
            </div>
        </div>
        @endforeach
    </div>
    @endif
</div>
