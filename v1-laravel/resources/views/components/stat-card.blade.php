@props(['title' => '', 'value' => '', 'icon' => '', 'color' => 'blue'])

@php
$bgColor = match($color) {
    'green' => 'bg-green-500',
    'red' => 'bg-red-500',
    'yellow' => 'bg-yellow-500',
    'purple' => 'bg-purple-500',
    'indigo' => 'bg-indigo-500',
    default => 'bg-blue-500',
};
@endphp

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
    <div class="flex items-center justify-between">
        <div>
            <p class="text-sm font-medium text-gray-500">{{ $title }}</p>
            <p class="mt-1 text-2xl font-bold text-gray-900">{{ $value }}</p>
        </div>
        <div class="w-12 h-12 {{ $bgColor }} rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">{!! $icon !!}</svg>
        </div>
    </div>
    @if($slot->isNotEmpty())
    <div class="mt-3 text-sm text-gray-500">{{ $slot }}</div>
    @endif
</div>
