@extends('layouts.app')
@section('title', 'Price History')

@section('content')
<div class="max-w-4xl mx-auto">
    <div class="mb-6">
        <a href="{{ route('items.index') }}" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Items</a>
        <h2 class="text-2xl font-bold text-gray-900 mt-2">Price History: {{ $item->name }}</h2>
        <p class="text-gray-500">{{ $item->code }} | {{ $item->unit }}</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-500">Price</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-500">Effective From</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-500">Effective To</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Created By</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Created At</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @forelse($prices as $price)
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 font-medium text-gray-900">{{ number_format($price->price, 2) }}</td>
                        <td class="px-4 py-3 text-gray-700">{{ $price->effective_from->format('d M Y') }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $price->effective_to ? $price->effective_to->format('d M Y') : 'Ongoing' }}</td>
                        <td class="px-4 py-3 text-gray-500 hidden sm:table-cell">{{ $price->creator->name ?? '-' }}</td>
                        <td class="px-4 py-3 text-gray-500 hidden sm:table-cell">{{ $price->created_at->format('d M Y H:i') }}</td>
                    </tr>
                    @empty
                    <tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No price history found.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="px-4 py-3 border-t">{{ $prices->links() }}</div>
    </div>
</div>
@endsection
