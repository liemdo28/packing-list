@extends('layouts.app')
@section('title', 'Add Price')

@section('content')
<div class="max-w-2xl mx-auto">
    <div class="mb-6">
        <a href="{{ route('prices.index') }}" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Prices</a>
        <h2 class="text-2xl font-bold text-gray-900 mt-2">Add Price</h2>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form method="POST" action="{{ route('prices.store') }}">
            @csrf
            <div class="space-y-4">
                <div>
                    <label for="item_id" class="block text-sm font-medium text-gray-700 mb-1">Item</label>
                    <select name="item_id" id="item_id" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                        <option value="">Select Item</option>
                        @foreach($items as $item)
                        <option value="{{ $item->id }}" {{ old('item_id') == $item->id ? 'selected' : '' }}>{{ $item->code }} - {{ $item->name }}</option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label for="price" class="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input type="number" name="price" id="price" value="{{ old('price') }}" required step="0.01" min="0"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label for="effective_from" class="block text-sm font-medium text-gray-700 mb-1">Effective From</label>
                        <input type="date" name="effective_from" id="effective_from" value="{{ old('effective_from', date('Y-m-d')) }}" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                    </div>
                    <div>
                        <label for="effective_to" class="block text-sm font-medium text-gray-700 mb-1">Effective To (optional)</label>
                        <input type="date" name="effective_to" id="effective_to" value="{{ old('effective_to') }}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                    </div>
                </div>
            </div>
            <div class="flex justify-end mt-6 space-x-3">
                <a href="{{ route('prices.index') }}" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</a>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Price</button>
            </div>
        </form>
    </div>
</div>
@endsection
