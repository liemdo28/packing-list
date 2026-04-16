@extends('layouts.app')
@section('title', 'Items')

@section('content')
<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
    <h2 class="text-2xl font-bold text-gray-900">Items</h2>
    <a href="{{ route('items.create') }}" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">Add Item</a>
</div>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Code</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Unit</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Category</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Current Price</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                @forelse($items as $item)
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium text-gray-900">{{ $item->code }}</td>
                    <td class="px-4 py-3 text-gray-700">{{ $item->name }}</td>
                    <td class="px-4 py-3 text-gray-500 hidden sm:table-cell">{{ $item->unit }}</td>
                    <td class="px-4 py-3 text-gray-500 hidden md:table-cell">{{ $item->category ?? '-' }}</td>
                    <td class="px-4 py-3 text-gray-700">{{ number_format($item->getCurrentPriceValue(), 2) }}</td>
                    <td class="px-4 py-3">
                        <x-badge :color="$item->active ? 'green' : 'red'">{{ $item->active ? 'Active' : 'Inactive' }}</x-badge>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex space-x-2">
                            <a href="{{ route('items.edit', $item) }}" class="text-blue-600 hover:text-blue-800 text-sm">Edit</a>
                            <a href="{{ route('prices.history', $item) }}" class="text-green-600 hover:text-green-800 text-sm">Prices</a>
                        </div>
                    </td>
                </tr>
                @empty
                <tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No items found.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="px-4 py-3 border-t">{{ $items->links() }}</div>
</div>
@endsection
