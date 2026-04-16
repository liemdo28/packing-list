@extends('layouts.app')
@section('title', 'Price Master')

@section('content')
<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
    <h2 class="text-2xl font-bold text-gray-900">Price Master</h2>
    <a href="{{ route('prices.create') }}" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">Add Price</a>
</div>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Item</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Price</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Effective From</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Effective To</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Created By</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                @forelse($prices as $price)
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">
                        <div class="font-medium text-gray-900">{{ $price->item->name ?? '-' }}</div>
                        <div class="text-xs text-gray-500">{{ $price->item->code ?? '' }}</div>
                    </td>
                    <td class="px-4 py-3 font-medium text-gray-900">{{ number_format($price->price, 2) }}</td>
                    <td class="px-4 py-3 text-gray-700">{{ $price->effective_from->format('d M Y') }}</td>
                    <td class="px-4 py-3 text-gray-500 hidden sm:table-cell">{{ $price->effective_to ? $price->effective_to->format('d M Y') : 'Ongoing' }}</td>
                    <td class="px-4 py-3 text-gray-500 hidden md:table-cell">{{ $price->creator->name ?? '-' }}</td>
                </tr>
                @empty
                <tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No prices found.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="px-4 py-3 border-t">{{ $prices->links() }}</div>
</div>
@endsection
