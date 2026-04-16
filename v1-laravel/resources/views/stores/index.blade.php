@extends('layouts.app')
@section('title', 'Stores')

@section('content')
<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
    <h2 class="text-2xl font-bold text-gray-900">Stores</h2>
    <a href="{{ route('stores.create') }}" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">Add Store</a>
</div>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Code</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Address</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Phone</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                @forelse($stores as $store)
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium text-gray-900">{{ $store->code }}</td>
                    <td class="px-4 py-3 text-gray-700">{{ $store->name }}</td>
                    <td class="px-4 py-3 text-gray-500 hidden sm:table-cell">{{ $store->address ?? '-' }}</td>
                    <td class="px-4 py-3 text-gray-500 hidden md:table-cell">{{ $store->phone ?? '-' }}</td>
                    <td class="px-4 py-3">
                        <x-badge :color="$store->active ? 'green' : 'red'">{{ $store->active ? 'Active' : 'Inactive' }}</x-badge>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex space-x-2">
                            <a href="{{ route('stores.edit', $store) }}" class="text-blue-600 hover:text-blue-800 text-sm">Edit</a>
                            <form method="POST" action="{{ route('stores.destroy', $store) }}" onsubmit="return confirm('Delete this store?')">
                                @csrf @method('DELETE')
                                <button type="submit" class="text-red-600 hover:text-red-800 text-sm">Delete</button>
                            </form>
                        </div>
                    </td>
                </tr>
                @empty
                <tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No stores found.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="px-4 py-3 border-t">{{ $stores->links() }}</div>
</div>
@endsection
